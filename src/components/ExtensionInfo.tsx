
export const ExtensionInfo = () => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">Version</h3>
        <p className="text-sm text-muted-foreground">1.0.0</p>
      </div>
      
      <div>
        <h3 className="font-medium">Description</h3>
        <p className="text-sm text-muted-foreground">
          GitHub Downloader & Analyzer enhances your GitHub experience by adding useful tools 
          for downloading files, analyzing repositories, and exporting documentation.
        </p>
      </div>
      
      <div>
        <h3 className="font-medium">Instructions</h3>
        <ol className="list-decimal list-inside text-sm text-muted-foreground ml-2 space-y-1">
          <li>Add your GitHub API key in the Settings tab</li>
          <li>Visit any GitHub repository</li>
          <li>Use the new features that appear in the GitHub UI</li>
        </ol>
      </div>
      
      <div>
        <h3 className="font-medium">Permissions</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
          <li>Storage: To save your API key and preferences</li>
          <li>GitHub.com: To enhance the GitHub website</li>
          <li>Downloads: To download selected files</li>
        </ul>
      </div>
    </div>
  );
};
