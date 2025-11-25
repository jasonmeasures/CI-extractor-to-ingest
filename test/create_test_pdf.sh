#!/bin/bash
# Create a minimal test PDF using available tools

echo "Creating test PDF..."

# Try using text2pdf or other tools
if command -v text2pdf >/dev/null 2>&1; then
    echo "COMMERCIAL INVOICE
Invoice Number: INV-001
Date: 2024-01-15

Item 1: Computer Processor
SKU: COMP001
Quantity: 10
Price: \$850.00

Item 2: Memory Module  
SKU: MEM002
Quantity: 20
Price: \$150.00

Total: \$11,500.00" | text2pdf -o test_invoice.pdf
elif command -v ps2pdf >/dev/null 2>&1; then
    # Create PostScript then convert
    cat > test_invoice.ps << 'PSEOF'
%!PS
/Times-Roman findfont 12 scalefont setfont
100 700 moveto
(COMMERCIAL INVOICE) show
100 680 moveto
(Invoice Number: INV-001) show
100 660 moveto
(Date: 2024-01-15) show
100 620 moveto
(Item 1: Computer Processor) show
100 600 moveto
(SKU: COMP001) show
100 580 moveto
(Quantity: 10 Price: \$850.00) show
100 540 moveto
(Item 2: Memory Module) show
100 520 moveto
(SKU: MEM002) show
100 500 moveto
(Quantity: 20 Price: \$150.00) show
100 460 moveto
(Total: \$11,500.00) show
showpage
PSEOF
    ps2pdf test_invoice.ps test_invoice.pdf
    rm test_invoice.ps
else
    echo "⚠️  No PDF creation tools found"
    echo "Please create test_invoice.pdf manually or install:"
    echo "  - Python reportlab: pip3 install reportlab"
    echo "  - Or use any PDF creation tool"
    exit 1
fi

if [ -f "test_invoice.pdf" ]; then
    echo "✅ Test PDF created: test_invoice.pdf"
else
    echo "❌ Failed to create PDF"
    exit 1
fi
