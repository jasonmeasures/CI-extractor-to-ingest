name: Unified PDF Parser
description: >-
  Classifies a document and routes it to the appropriate workflow based on its
  type
workflow_inputs:
  - name: pdf_document
    description: ''
    data_type: document_base64
    value: null
    is_optional: false
    choices: null
    is_hidden: false
  - name: custom_instructions
    description: ''
    data_type: string
    value: ''
    is_optional: true
    choices: null
    is_hidden: false
nodes:
  Classify-Document:
    do: Classify the type of document using LLM analysis
    node_inputs:
      pdf_document:
        input_path: workflow_inputs.pdf_document
    code: |
      import json
      import logging

      # Set up logger
      logger = logging.getLogger(__name__)

      try:
          logger.info("📄 Starting document classification...")
          
          # Get PDF document and custom instructions from input
          input_base64_content = node_inputs.pdf_document
          conversion_result = doctopdf.convert_to_pdf_base64(base64_string=input_base64_content)
          pdf_base64_content = conversion_result.pdf_base64_string
          pdf_data_url = f"data:application/pdf;base64,{pdf_base64_content}"
          custom_instructions = node_inputs.custom_instructions
          
          # Check page count first
          import base64
          import io
          from PyPDF2 import PdfReader, PdfWriter
          
          pdf_bytes = base64.b64decode(pdf_base64_content)
          pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
          page_count = len(pdf_reader.pages)
          logger.info(f"📄 PDF has {page_count} pages")
          
          # If less than 15 pages, skip LLM and use Process Document Compressed
          _decoded_bytes = base64.b64decode(input_base64_content)
          # XLSX files are ZIP archives and start with PK signature
          is_xlsx = False
          if _decoded_bytes.startswith(b'PK'):
              # Additional check: try to verify it's XLSX by checking for Excel-specific files in ZIP
              # XLSX files contain [Content_Types].xml in the ZIP structure
              # For simplicity, we'll check if it starts with PK and has reasonable size
              if len(_decoded_bytes) > 100:  # Basic size check
                  logger.info("📊 XLSX file detected, classifying as 'Sheet by Sheet JSON Extraction'")
                  document_classification_display_output = "Sheet by Sheet JSON Extraction"
                  is_xlsx = True
              else:
                  # Might be other ZIP-based format, proceed with PDF logic
                  raise ValueError("File too small to be XLSX")
          if page_count < 15 and not is_xlsx:
              logger.info(f"📋 PDF has {page_count} pages (< 15), skipping LLM classification and using 'Process Document Compressed'")
              
              # Set classification directly without LLM call
              document_classification_display_output = "Process Document Compressed"
              
              logger.info(f"✅ Auto-classified: Short document ({page_count} pages) -> Process Document Compressed")
              
          elif page_count >= 15 and not is_xlsx:
              logger.info(f"📄 PDF has {page_count} pages (>= 15), creating PDF with first 15 pages for LLM classification")
              
              # Create a new PDF with only the first 15 pages (use _ prefix for intermediate vars)
              _pdf_writer = PdfWriter()
              for _page_num in range(min(15, page_count)):
                  _pdf_writer.add_page(pdf_reader.pages[_page_num])
              
              # Convert first 15 pages to base64
              _selected_buffer = io.BytesIO()
              _pdf_writer.write(_selected_buffer)
              _selected_bytes = _selected_buffer.getvalue()
              _selected_base64 = base64.b64encode(_selected_bytes).decode("utf-8")
              _selected_pdf_url = f"data:application/pdf;base64,{_selected_base64}"
              
              # Create classification prompt
              _classification_prompt = f"""
              Analyze this document and determine which workflow would be most appropriate for processing it.
              
              Available Workflows:
              
              1. **Page by Page JSON Extraction** - Use when:
                 - Document contains multiple types of content/sections
                 - Mixed document types in a single file
                 - General-purpose extraction needed
                 - Document has varied content structure
                 - Document is a CI (Commercial Invoice) type but there are multiple CI documents in one.
              
              2. **Enhanced PDF to JSON Extraction** - Use when:
                 - Document is a CI (Commercial Invoice) type
                 - Contains lists of items/products
                 - Receipt or invoice format
                 - Structured tabular data
                 - Line items with quantities, prices, descriptions
              
              3. **Process Document Compressed** - Use when:
                 - Document has 25+ items on a single page
                 - Highly compressed/dense data
                 - Small text/font sizes
                 - Crowded layout with many data points
                 - Packed information requiring careful parsing
              
              Return ONLY the workflow name: "Page by Page JSON Extraction", "Enhanced PDF to JSON Extraction", or "Process Document Compressed"
              """
              
              logger.info("📡 Sending document to LLM for classification...")
              
              # Call LLM with simple text output using selected pages
              _classification_result = llm.chat(
                  model="gemini-2.5-flash",
                  prompt_str=_classification_prompt,
                  file_data=_selected_pdf_url,
                  file_name="selected_pages_for_classification.pdf"
              )
              
              # Extract workflow name from response (use underscore prefix to avoid capturing in output)
              _suggested_workflow = _classification_result.content
              
              # Check for keywords in response to determine workflow
              _response_lower = _suggested_workflow.lower()
              if 'compressed' in _response_lower:
                  _suggested_workflow = 'Process Document Compressed'
              elif 'enhanced' in _response_lower or 'json' in _response_lower:
                  _suggested_workflow = 'Enhanced PDF to JSON Extraction'
              elif 'page' in _response_lower:
                  _suggested_workflow = 'Page by Page JSON Extraction'
              else:
                  # Default fallback
                  _suggested_workflow = 'Page by Page JSON Extraction'
              
              logger.info(f"✅ LLM suggested workflow: {_suggested_workflow}")
              
              # Store classification result (just the string, not the full LLM response object)
              document_classification_display_output = _suggested_workflow
               
      except Exception as e:
          logger.info(f"❌ Error in document classification: {str(e)}")
          document_classification_display_output = "Page by Page JSON Extraction"
    output_validation: null
    node_type: python
    id: 0
  Run-Classified-Workflow:
    do: Run the appropriate workflow based on document classification
    node_inputs:
      pdf_document:
        input_path: workflow_inputs.pdf_document
      custom_instructions:
        input_path: workflow_inputs.custom_instructions
      classification:
        node_name: Classify-Document
        output_field: document_classification_display_output
    code: |
      import json
      import logging

      # Set up logger
      logger = logging.getLogger(__name__)

      try:
          # Get classification result from previous node (now just workflow name)
          suggested_workflow = node_inputs.classification
          
          # Validate workflow name and default to Page by Page if invalid
          valid_workflows = [
              'Page by Page JSON Extraction',
              'Enhanced PDF to JSON Extraction', 
              'Process Document Compressed'
          ]
          
          if suggested_workflow not in valid_workflows:
              logger.info(f"⚠️ Invalid workflow name '{suggested_workflow}' detected. Defaulting to 'Page by Page JSON Extraction'")
              suggested_workflow = 'Page by Page JSON Extraction'
          
          logger.info(f"🔄 Preparing to run workflow: {suggested_workflow}")
          
          # Get workflow configuration
          run_config = WorkflowConfig.get_run_config()
          current_node_id = WorkflowConfig.get_current_node_id()
          
          # Prepare workflow inputs
          custom_instructions = node_inputs.custom_instructions
          enhanced_instructions = f"Please extract relevant information from this document using the {suggested_workflow} workflow."
          
          # Combine with user's custom instructions if provided
          if custom_instructions and custom_instructions.strip() and custom_instructions.strip().lower() != 'none':
              enhanced_instructions += f"\n\nAdditional Instructions:\n{custom_instructions.strip()}"
          
          input_base64_content = node_inputs.pdf_document
          conversion_result = doctopdf.convert_to_pdf_base64(base64_string=input_base64_content)
          pdf_base64_content = conversion_result.pdf_base64_string
          workflow_inputs = {
              'pdf_document': pdf_base64_content,
              'custom_instructions': enhanced_instructions
          }
          
          # Run the suggested workflow as a subworkflow
          logger.info(f"🚀 Running workflow: {suggested_workflow}...")
          
          workflow_result = workflow.run_workflow(
              workflow_name=suggested_workflow,
              workflow_inputs=workflow_inputs,
              parent_run_id=run_config.run_identifiers.nested_run_id,
              parent_node_id=current_node_id
          )
          
          logger.info(f"✅ Workflow '{suggested_workflow}' completed successfully")
          
          # Extract results from the workflow
          final_display_output = workflow_result.content.get('final_display_output', workflow_result.content)
          
          logger.info("🎉 Document processing complete!")
          
      except Exception as e:
          logger.info(f"❌ Error running workflow: {str(e)}")
          
          # Fallback to basic extraction if workflow fails
          final_display_output = {
              "workflow_executed": "None (failed)",
              "error": str(e),
              "status": "workflow_execution_failed"
          }
    output_validation: null
    node_type: python
    id: 1
