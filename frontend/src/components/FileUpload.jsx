import './FileUpload.css'

function FileUpload({ file, onFileSelect, onExtract, processing, disabled }) {
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div className="file-upload">
      <label className="file-label" htmlFor="pdf-file-input">
        Select Commercial Invoice PDF
      </label>
      <input
        id="pdf-file-input"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="file-input"
        disabled={processing}
        style={{ 
          display: 'block', 
          width: '100%',
          position: 'relative',
          zIndex: 1,
          opacity: 1,
          pointerEvents: processing ? 'none' : 'auto'
        }}
      />
      {file && (
        <p className="file-info">
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </p>
      )}
      <button
        onClick={onExtract}
        disabled={disabled}
        className={`extract-btn ${disabled ? 'disabled' : ''}`}
      >
        {processing ? 'Processing with A79...' : 'Extract Line Items via A79'}
      </button>
    </div>
  )
}

export default FileUpload

