
import { Check } from "lucide-react";

export const FeaturesList = () => {
  const features = [
    {
      title: "File & Folder Downloader",
      description: "Multi-select and download files/folders as ZIP"
    },
    {
      title: "Repository Insights Panel",
      description: "View repository size, file counts, language usage and more"
    },
    {
      title: "README Export",
      description: "Export README files as PDF or DOCX"
    },
    {
      title: "Repository Size Display",
      description: "Visual breakdown of repository size by directory"
    },
    {
      title: "Quick Navigation Sidebar",
      description: "Easily navigate between files and folders"
    }
  ];
  
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-1 bg-green-100 rounded-full p-0.5">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
};
