
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DOWNLOAD_FILES") {
    downloadFiles(message.data, sendResponse);
    return true; // Required for async response
  } else if (message.type === "FETCH_REPO_DATA") {
    fetchRepoData(message.owner, message.repo, message.token, sendResponse);
    return true; // Required for async response
  } else if (message.type === "EXPORT_README") {
    exportReadme(message.format, message.content, message.repoName, sendResponse);
    return true; // Required for async response
  }
});

// Download files as ZIP
async function downloadFiles(data, sendResponse) {
  try {
    // Create download from the provided data
    chrome.downloads.download({
      url: data.downloadUrl,
      filename: data.filename,
      saveAs: true
    }, (downloadId) => {
      sendResponse({ success: true, downloadId });
    });
  } catch (error) {
    console.error("Error downloading files:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Fetch repository data from GitHub API
async function fetchRepoData(owner, repo, token, sendResponse) {
  try {
    // Repository details
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    if (!repoResponse.ok) {
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }
    
    const repoData = await repoResponse.json();
    
    // Languages data
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const languagesData = await languagesResponse.json();
    
    // Contributors data
    const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const contributorsData = await contributorsResponse.json();
    
    // Commits frequency data (last 4 weeks)
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    const commitsData = await commitsResponse.json();
    
    sendResponse({ 
      success: true, 
      data: {
        repo: repoData,
        languages: languagesData,
        contributors: contributorsData,
        commits: commitsData ? commitsData.slice(-4) : []
      } 
    });
  } catch (error) {
    console.error("Error fetching repo data:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Export README file in different formats
function exportReadme(format, content, repoName, sendResponse) {
  try {
    let dataUrl;
    let filename = `${repoName}-README.${format}`;
    
    if (format === 'pdf') {
      // Basic PDF creation (in a real extension we would use a PDF generation library)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${repoName} - README</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; margin: 40px; }
            pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
            code { font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace; }
            h1 { padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; }
            h2 { padding-bottom: 0.3em; border-bottom: 1px solid #eaecef; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>`;
        
      // In a real extension, convert HTML to PDF using a library
      // For now, just download as HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      dataUrl = URL.createObjectURL(blob);
    } else if (format === 'docx') {
      // For simplicity, download as plaintext with .docx extension
      // In a real extension, we would use a proper DOCX generation library
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      dataUrl = URL.createObjectURL(blob);
    } else {
      // Default to text
      const blob = new Blob([content], { type: 'text/plain' });
      dataUrl = URL.createObjectURL(blob);
    }
    
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    }, (downloadId) => {
      sendResponse({ success: true, downloadId });
    });
  } catch (error) {
    console.error("Error exporting README:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
}
