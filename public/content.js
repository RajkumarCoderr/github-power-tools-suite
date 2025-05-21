
// Main initialization function
function initGitHubEnhancer() {
  // Check if we're on a GitHub repo page
  if (!isGitHubRepoPage()) return;
  
  // Get repo information
  const { owner, repo, path } = getRepoInfo();
  if (!owner || !repo) return;
  
  // Check if extension is enabled
  chrome.storage.local.get(['extension_enabled', 'github_api_key'], function(result) {
    if (result.extension_enabled === false) return;
    
    const githubToken = result.github_api_key || '';
    
    // Initialize the components
    initFileCheckboxes();
    initDownloadFAB();
    initRepoInsightsPanel(owner, repo, githubToken);
    initReadmeExport(owner, repo);
    initRepoSizeDisplay(owner, repo, githubToken);
    initQuickNavSidebar();
  });
}

// Helper functions
function isGitHubRepoPage() {
  return window.location.hostname === 'github.com' && 
         document.querySelector('.repository-content') !== null;
}

function getRepoInfo() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const owner = pathParts[0];
    const repo = pathParts[1];
    const path = pathParts.slice(3).join('/');
    return { owner, repo, path };
  }
  return { owner: null, repo: null, path: null };
}

// Add file checkboxes next to files/folders
function initFileCheckboxes() {
  // Target the file list
  const fileList = document.querySelector('.js-navigation-container');
  if (!fileList) return;
  
  // Add checkboxes to each row
  const rows = fileList.querySelectorAll('.js-navigation-item');
  rows.forEach(row => {
    // Skip if already has checkbox or is a navigation row
    if (row.querySelector('.gda-checkbox') || row.querySelector('.up-tree')) return;
    
    const cell = document.createElement('td');
    cell.className = 'gda-checkbox-cell';
    cell.style.width = '20px';
    cell.style.paddingLeft = '12px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'gda-checkbox';
    checkbox.style.cursor = 'pointer';
    
    // Get file/folder path from the link
    const link = row.querySelector('a[href]');
    if (link) {
      const path = link.getAttribute('href').split('/').slice(3).join('/');
      checkbox.dataset.path = path;
      
      // Determine if it's a file or folder
      const icon = row.querySelector('.octicon');
      checkbox.dataset.type = icon && icon.classList.contains('octicon-file') ? 'file' : 'folder';
    }
    
    cell.appendChild(checkbox);
    row.insertBefore(cell, row.firstChild);
  });
}

// Add a floating action button for downloads
function initDownloadFAB() {
  // Remove existing FAB if present
  const existingFAB = document.getElementById('gda-download-fab');
  if (existingFAB) existingFAB.remove();
  
  // Create the FAB
  const fab = document.createElement('div');
  fab.id = 'gda-download-fab';
  fab.className = 'gda-fab';
  fab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
  fab.title = 'Download Selected Files';
  fab.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background-color: #0969DA;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 1000;
    transition: all 0.3s ease;
    opacity: 0.9;
  `;
  
  // Add hover effect
  fab.addEventListener('mouseenter', () => {
    fab.style.opacity = '1';
    fab.style.transform = 'scale(1.05)';
  });
  
  fab.addEventListener('mouseleave', () => {
    fab.style.opacity = '0.9';
    fab.style.transform = 'scale(1)';
  });
  
  // Add click handler
  fab.addEventListener('click', () => {
    downloadSelectedFiles();
  });
  
  document.body.appendChild(fab);
  
  // Initially hide the FAB
  fab.style.display = 'none';
  
  // Show FAB when at least one file is selected
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('gda-checkbox')) {
      const checkedBoxes = document.querySelectorAll('.gda-checkbox:checked');
      fab.style.display = checkedBoxes.length > 0 ? 'flex' : 'none';
    }
  });
}

// Handle downloading selected files
function downloadSelectedFiles() {
  const { owner, repo } = getRepoInfo();
  const checkedBoxes = document.querySelectorAll('.gda-checkbox:checked');
  
  if (checkedBoxes.length === 0) {
    showNotification('Please select files or folders to download', 'error');
    return;
  }
  
  const paths = Array.from(checkedBoxes).map(cb => cb.dataset.path);
  
  // Get the GitHub branch
  const branchElement = document.querySelector('.branch-name');
  const branch = branchElement ? branchElement.textContent : 'master';
  
  // For a single file, use direct download
  if (paths.length === 1 && checkedBoxes[0].dataset.type === 'file') {
    const downloadUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${paths[0]}`;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILES',
      data: {
        downloadUrl: downloadUrl,
        filename: paths[0].split('/').pop()
      }
    }, response => {
      if (response.success) {
        showNotification('File download started', 'success');
      } else {
        showNotification('Failed to download file: ' + response.error, 'error');
      }
    });
  } else {
    // For multiple files or folders, use the GitHub zipball API
    // In a real extension, we would create a custom zip with only the selected files
    // For this demo, we'll download the whole repo or branch
    const downloadUrl = `https://github.com/${owner}/${repo}/zipball/${branch}`;
    chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILES',
      data: {
        downloadUrl: downloadUrl,
        filename: `${repo}-${branch}.zip`
      }
    }, response => {
      if (response.success) {
        showNotification(`Download started for ${paths.length} items`, 'success');
      } else {
        showNotification('Failed to download: ' + response.error, 'error');
      }
    });
  }
}

// Repository Insights Panel
function initRepoInsightsPanel(owner, repo, token) {
  // Check if panel already exists
  if (document.getElementById('gda-insights-panel')) return;
  
  // Create the panel
  const panel = document.createElement('div');
  panel.id = 'gda-insights-panel';
  panel.className = 'gda-panel';
  panel.innerHTML = `
    <div class="gda-panel-header">
      <h3>Repository Insights</h3>
      <button class="gda-panel-close">×</button>
    </div>
    <div class="gda-panel-content">
      <div class="gda-loading">Loading repository insights...</div>
    </div>
  `;
  
  // Style the panel
  panel.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    width: 320px;
    max-height: calc(100vh - 100px);
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 3px 12px rgba(27, 31, 35, 0.15);
    z-index: 99;
    overflow: hidden;
    transition: all 0.3s ease;
  `;
  
  // Add styles for header and content
  const style = document.createElement('style');
  style.textContent = `
    .gda-panel-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e1e4e8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .gda-panel-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .gda-panel-close {
      background: none;
      border: none;
      color: #57606a;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
    }
    
    .gda-panel-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(100vh - 160px);
    }
    
    .gda-loading {
      color: #57606a;
      text-align: center;
      padding: 20px 0;
    }
    
    .gda-stat {
      margin-bottom: 16px;
    }
    
    .gda-stat-title {
      font-size: 12px;
      color: #57606a;
      margin-bottom: 4px;
    }
    
    .gda-stat-value {
      font-size: 16px;
      font-weight: 600;
    }
    
    .gda-lang-bar {
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      margin-bottom: 8px;
      background-color: #edf0f2;
    }
    
    .gda-lang-segment {
      height: 100%;
    }
    
    .gda-lang-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .gda-lang-item {
      display: flex;
      align-items: center;
      font-size: 12px;
    }
    
    .gda-lang-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 4px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(panel);
  
  // Close button handler
  panel.querySelector('.gda-panel-close').addEventListener('click', () => {
    panel.style.transform = 'translateX(400px)';
    setTimeout(() => panel.remove(), 300);
  });
  
  // Fetch repository data
  chrome.runtime.sendMessage({
    type: 'FETCH_REPO_DATA',
    owner: owner,
    repo: repo,
    token: token
  }, response => {
    if (!response.success) {
      panel.querySelector('.gda-panel-content').innerHTML = `
        <div class="gda-error">
          Error loading insights: ${response.error || 'Unknown error'}
        </div>
      `;
      return;
    }
    
    const { data } = response;
    const repoData = data.repo;
    const languages = data.languages;
    const contributors = data.contributors;
    const commits = data.commits || [];
    
    // Calculate total language bytes
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + Number(bytes), 0);
    
    // Language color map (simplified)
    const languageColors = {
      "JavaScript": "#f1e05a",
      "TypeScript": "#3178c6",
      "Python": "#3572A5",
      "Java": "#b07219",
      "C#": "#178600",
      "PHP": "#4F5D95",
      "C++": "#f34b7d",
      "Ruby": "#701516",
      "Go": "#00ADD8",
      "HTML": "#e34c26",
      "CSS": "#563d7c",
      "Shell": "#89e051"
    };
    
    // Generate HTML for insights
    const insightsHtml = `
      <div class="gda-stat">
        <div class="gda-stat-title">Repository Size</div>
        <div class="gda-stat-value">${formatBytes(repoData.size * 1024)}</div>
      </div>
      
      <div class="gda-stat">
        <div class="gda-stat-title">Languages</div>
        <div class="gda-lang-bar">
          ${Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .map(([lang, bytes]) => {
              const percentage = (Number(bytes) / totalBytes * 100).toFixed(1);
              const color = languageColors[lang] || '#8e8e8e';
              return `<div class="gda-lang-segment" style="width: ${percentage}%; background-color: ${color};" title="${lang}: ${percentage}%"></div>`;
            })
            .join('')}
        </div>
        <div class="gda-lang-list">
          ${Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang, bytes]) => {
              const percentage = (Number(bytes) / totalBytes * 100).toFixed(1);
              const color = languageColors[lang] || '#8e8e8e';
              return `
                <div class="gda-lang-item">
                  <div class="gda-lang-color" style="background-color: ${color};"></div>
                  <span>${lang} ${percentage}%</span>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
      
      <div class="gda-stat">
        <div class="gda-stat-title">Top Contributors</div>
        <div class="gda-contributors">
          ${contributors.slice(0, 5).map(contributor => `
            <div class="gda-contributor">
              <img src="${contributor.avatar_url}" alt="${contributor.login}" width="20" height="20" style="border-radius: 50%; margin-right: 8px;">
              <a href="${contributor.html_url}" target="_blank">${contributor.login}</a>
              <span class="gda-commits">${contributor.contributions} commits</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="gda-stat">
        <div class="gda-stat-title">Commit Activity (Last 4 Weeks)</div>
        <div class="gda-commits-chart" style="display: flex; align-items: flex-end; height: 100px; gap: 4px;">
          ${commits.map(week => {
            const commitCount = week.total;
            const height = Math.min(100, Math.max(4, commitCount * 5));
            return `
              <div class="gda-commit-bar" style="height: ${height}px; background-color: #0969DA; flex: 1; border-radius: 3px 3px 0 0;" title="${commitCount} commits"></div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #57606a;">
          ${commits.map((_, i) => `<div>${i + 1} week${i > 0 ? 's' : ''} ago</div>`).join('')}
        </div>
      </div>
    `;
    
    panel.querySelector('.gda-panel-content').innerHTML = insightsHtml;
  });
  
  // Add button to toggle panel
  const toggleButton = document.createElement('button');
  toggleButton.className = 'btn btn-sm';
  toggleButton.innerHTML = '<span>Insights</span>';
  toggleButton.style.marginLeft = '8px';
  
  // Find the place to insert the button (next to "Code" button)
  const codeButton = document.querySelector('.file-navigation');
  if (codeButton) {
    codeButton.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', () => {
      const panel = document.getElementById('gda-insights-panel');
      if (panel) {
        panel.style.transform = panel.style.transform ? '' : 'translateX(400px)';
        setTimeout(() => panel.remove(), panel.style.transform ? 300 : 0);
      } else {
        initRepoInsightsPanel(owner, repo, token);
      }
    });
  }
}

// README Export functionality
function initReadmeExport(owner, repo) {
  // Check if we're on a README page
  const readmeContent = document.querySelector('#readme .markdown-body');
  if (!readmeContent) return;
  
  // Create export buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'gda-readme-export';
  buttonContainer.style.cssText = `
    position: absolute;
    top: 12px;
    right: 16px;
    display: flex;
    gap: 8px;
  `;
  
  // PDF Export button
  const pdfButton = document.createElement('button');
  pdfButton.className = 'btn btn-sm';
  pdfButton.textContent = 'Export PDF';
  pdfButton.addEventListener('click', () => exportReadme('pdf'));
  
  // DOCX Export button
  const docxButton = document.createElement('button');
  docxButton.className = 'btn btn-sm';
  docxButton.textContent = 'Export DOCX';
  docxButton.addEventListener('click', () => exportReadme('docx'));
  
  buttonContainer.appendChild(pdfButton);
  buttonContainer.appendChild(docxButton);
  
  // Add buttons to README header
  const readmeHeader = document.querySelector('#readme .Box-header');
  if (readmeHeader) {
    readmeHeader.style.position = 'relative';
    readmeHeader.appendChild(buttonContainer);
  }
  
  // Export README function
  function exportReadme(format) {
    const readmeHTML = readmeContent.innerHTML;
    chrome.runtime.sendMessage({
      type: 'EXPORT_README',
      format: format,
      content: readmeHTML,
      repoName: repo
    }, response => {
      if (response.success) {
        showNotification(`README export started as ${format.toUpperCase()}`, 'success');
      } else {
        showNotification(`Failed to export README: ${response.error}`, 'error');
      }
    });
  }
}

// Repository Size Display
function initRepoSizeDisplay(owner, repo, token) {
  // Check if already initialized
  if (document.getElementById('gda-repo-size')) return;
  
  // Create repo size container
  const sizeContainer = document.createElement('div');
  sizeContainer.id = 'gda-repo-size';
  sizeContainer.className = 'gda-section Box mt-3';
  sizeContainer.innerHTML = `
    <div class="Box-header">
      <h2 class="Box-title">Repository Size</h2>
      <button class="gda-collapse-btn">▼</button>
    </div>
    <div class="Box-body">
      <div class="gda-loading">Loading repository size information...</div>
    </div>
  `;
  
  // Find where to insert the size display
  const repoAbout = document.querySelector('.repository-content .Layout-sidebar');
  if (repoAbout) {
    repoAbout.appendChild(sizeContainer);
    
    // Toggle collapse
    sizeContainer.querySelector('.gda-collapse-btn').addEventListener('click', (e) => {
      const btn = e.target;
      const body = sizeContainer.querySelector('.Box-body');
      
      if (body.style.display === 'none') {
        body.style.display = 'block';
        btn.textContent = '▼';
      } else {
        body.style.display = 'none';
        btn.textContent = '►';
      }
    });
    
    // Fetch repo size data (simplified - in a real extension we would analyze the repository structure)
    chrome.runtime.sendMessage({
      type: 'FETCH_REPO_DATA',
      owner: owner,
      repo: repo,
      token: token
    }, response => {
      if (!response.success) {
        sizeContainer.querySelector('.Box-body').innerHTML = `
          <div class="gda-error">
            Error loading size information: ${response.error || 'Unknown error'}
          </div>
        `;
        return;
      }
      
      const { data } = response;
      const repoSize = data.repo.size * 1024; // Convert from KB to bytes
      
      // Create size breakdown (simplified since we don't have actual directory sizes)
      const sizeHTML = `
        <div class="gda-size-total mb-3">
          <strong>Total Size:</strong> ${formatBytes(repoSize)}
        </div>
        <div class="gda-size-chart">
          <div class="gda-size-bar" style="height: 20px; background: linear-gradient(to right, #0366d6, #2188ff); border-radius: 3px;">
            100%
          </div>
        </div>
        <div class="gda-size-breakdown mt-2">
          <p>Size by directory breakdown is not available in this version.</p>
        </div>
      `;
      
      sizeContainer.querySelector('.Box-body').innerHTML = sizeHTML;
    });
  }
}

// Quick Navigation Sidebar
function initQuickNavSidebar() {
  // Check if already initialized
  if (document.getElementById('gda-nav-sidebar')) return;
  
  // Create sidebar container
  const sidebar = document.createElement('div');
  sidebar.id = 'gda-nav-sidebar';
  sidebar.className = 'gda-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    top: 60px;
    left: -250px;
    width: 250px;
    height: calc(100vh - 60px);
    background-color: white;
    border-right: 1px solid #e1e4e8;
    z-index: 99;
    transition: all 0.3s ease;
    overflow-y: auto;
  `;
  
  sidebar.innerHTML = `
    <div class="gda-sidebar-header" style="padding: 16px; border-bottom: 1px solid #e1e4e8; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Quick Navigation</h3>
      <button class="gda-sidebar-close" style="background: none; border: none; color: #57606a; font-size: 18px; cursor: pointer; padding: 0;">×</button>
    </div>
    <div class="gda-sidebar-content" style="padding: 16px;">
      <div class="gda-loading">Loading directory structure...</div>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  
  // Close button handler
  sidebar.querySelector('.gda-sidebar-close').addEventListener('click', () => {
    sidebar.style.left = '-250px';
  });
  
  // Generate directory structure (simplified)
  const fileElements = document.querySelectorAll('.js-navigation-container .js-navigation-item');
  if (fileElements.length > 0) {
    const fileList = Array.from(fileElements).map(el => {
      const link = el.querySelector('a[href]');
      const icon = el.querySelector('.octicon');
      
      if (!link) return null;
      
      const isDir = icon && icon.classList.contains('octicon-file-directory');
      const name = link.textContent.trim();
      const path = link.getAttribute('href');
      
      return { name, path, isDir };
    }).filter(Boolean);
    
    const navHTML = `
      <ul class="gda-nav-list" style="list-style: none; padding: 0; margin: 0;">
        <li>
          <a href="#" class="gda-nav-link" style="display: flex; align-items: center; padding: 8px 0; color: #0969da; text-decoration: none;">
            <svg style="margin-right: 8px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
              <path fill-rule="evenodd" d="M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25H1.75zM0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0114.25 15H1.75A1.75 1.75 0 010 13.25V2.75zm5.03 3.47a.75.75 0 010 1.06L2.56 9.75l2.47 2.47a.75.75 0 11-1.06 1.06L1.22 10.53a.75.75 0 010-1.06l2.75-2.75a.75.75 0 011.06 0zm2.44-2.47a.75.75 0 011.06 0l2.75 2.75a.75.75 0 010 1.06l-2.75 2.75a.75.75 0 11-1.06-1.06l2.47-2.47-2.47-2.47a.75.75 0 010-1.06z"></path>
            </svg>
            Root
          </a>
        </li>
        ${fileList.map(file => `
          <li>
            <a href="${file.path}" class="gda-nav-link" style="display: flex; align-items: center; padding: 8px 0; color: #24292f; text-decoration: none; font-size: 14px; ${file.isDir ? 'font-weight: 600;' : ''}">
              <svg style="margin-right: 8px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
                <path fill-rule="evenodd" d="${file.isDir ? 
                  'M1.75 2.5a.25.25 0 00-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V2.75a.25.25 0 00-.25-.25H1.75zM.75 2.75C.75 1.784 1.784.75 2.75.75h10.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0113.25 12.5h-9.5v1.75c0 .966.784 1.75 1.75 1.75H9a.75.75 0 010 1.5H5.5A3.25 3.25 0 012.25 14v-1.5H1.75A1.75 1.75 0 010 10.75v-8A1.75 1.75 0 01.75 2.75z'
                  : 
                  'M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0113.25 16h-9.5A1.75 1.75 0 012 14.25V1.75zm3.811 8.793a.5.5 0 01-.416-.207l-1.5-2A.5.5 0 014.25 7.5h1.304l-.47-.674a.5.5 0 01.122-.616l2-1.5a.5.5 0 01.685.122l1.5 2a.5.5 0 01-.122.616L7.27 9.123a.5.5 0 01-.44.127l.471.675a.5.5 0 01-.122.616l-2 1.5a.5.5 0 01-.269.084zm.815-8.293a.25.25 0 00-.25-.25H4.5v1.59l.22-.22a.75.75 0 011.06 0l2.4 2.4a.75.75 0 010 1.06l-2.4 2.4a.75.75 0 01-1.06 0l-2.4-2.4a.75.75 0 010-1.06l.22-.22V1.75z'}"></path>
              </svg>
              ${file.name}
            </a>
          </li>
        `).join('')}
      </ul>
    `;
    
    sidebar.querySelector('.gda-sidebar-content').innerHTML = navHTML;
  }
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'btn btn-sm d-none d-md-block';
  toggleButton.innerHTML = '<span>Quick Nav</span>';
  toggleButton.style.marginLeft = '8px';
  
  const headerNav = document.querySelector('.file-navigation');
  if (headerNav) {
    headerNav.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', () => {
      sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
    });
  }
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existingNotif = document.getElementById('gda-notification');
  if (existingNotif) existingNotif.remove();
  
  // Create notification
  const notification = document.createElement('div');
  notification.id = 'gda-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
  `;
  
  // Set styles based on type
  if (type === 'error') {
    notification.style.backgroundColor = '#ffebe9';
    notification.style.color = '#cf222e';
    notification.style.border = '1px solid #ff8182';
  } else if (type === 'success') {
    notification.style.backgroundColor = '#dafbe1';
    notification.style.color = '#116329';
    notification.style.border = '1px solid #56d364';
  } else {
    notification.style.backgroundColor = '#ddf4ff';
    notification.style.color = '#0969da';
    notification.style.border = '1px solid #54aeff';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  // Dismiss after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Create and add styles
function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Checkbox styles */
    .gda-checkbox {
      margin: 0;
    }
    
    /* Notifications */
    #gda-notification {
      box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* Sidebar link hover */
    .gda-nav-link:hover {
      background-color: #f6f8fa;
    }
    
    /* Panel styles */
    .gda-panel {
      transform: translateX(0);
    }
    
    /* Contributors */
    .gda-contributors {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .gda-contributor {
      display: flex;
      align-items: center;
    }
    
    .gda-commits {
      margin-left: auto;
      font-size: 12px;
      color: #57606a;
    }
    
    /* Collapse button */
    .gda-collapse-btn {
      background: none;
      border: none;
      color: #57606a;
      cursor: pointer;
      padding: 0;
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize all components
function initialize() {
  addStyles();
  initGitHubEnhancer();
  
  // Re-initialize on page navigation (GitHub's PJAX)
  const observer = new MutationObserver((mutations) => {
    // Check if the URL has changed
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        if (document.querySelector('.repository-content')) {
          initGitHubEnhancer();
        }
      }
    });
  });
  
  // Observe the body for GitHub's PJAX navigation
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start the extension
setTimeout(initialize, 500);
