
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ApiKeyForm } from '@/components/ApiKeyForm';
import { ExtensionInfo } from '@/components/ExtensionInfo';
import { FeaturesList } from '@/components/FeaturesList';

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key exists in storage
    chrome.storage?.local?.get(['github_api_key'], (result) => {
      if (result.github_api_key) {
        setApiKey(result.github_api_key);
      }
    });

    // Check if extension is enabled
    chrome.storage?.local?.get(['extension_enabled'], (result) => {
      setIsEnabled(result.extension_enabled !== false);
    });
  }, []);

  const saveApiKey = (key: string) => {
    chrome.storage?.local?.set({ github_api_key: key }, () => {
      setApiKey(key);
      toast({
        title: "API Key Saved",
        description: "Your GitHub API key has been saved securely"
      });
    });
  };

  const toggleExtension = () => {
    const newState = !isEnabled;
    chrome.storage?.local?.set({ extension_enabled: newState }, () => {
      setIsEnabled(newState);
      toast({
        title: newState ? "Extension Enabled" : "Extension Disabled",
        description: newState 
          ? "GitHub Downloader & Analyzer is now active" 
          : "GitHub Downloader & Analyzer is now disabled"
      });
    });
  };

  // For non-extension environments (development)
  const isExtension = typeof chrome !== 'undefined' && chrome.storage;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-center my-6">
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-8 w-8" />
            <h1 className="text-xl font-bold">GitHub Downloader & Analyzer</h1>
          </div>
        </div>

        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Extension Settings</CardTitle>
                <CardDescription>Configure your GitHub API key and extension preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ApiKeyForm 
                  apiKey={apiKey} 
                  onSave={saveApiKey} 
                  disabled={!isExtension} 
                />
                <div className="space-y-2">
                  <label className="font-medium">Extension Status</label>
                  <div className="flex items-center justify-between">
                    <span>Enable GitHub Downloader & Analyzer</span>
                    <Button 
                      variant={isEnabled ? "default" : "outline"}
                      onClick={toggleExtension}
                      disabled={!isExtension}
                    >
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
                {isExtension ? 
                  "Settings will be applied when you visit GitHub" : 
                  "These controls only work in the extension environment"}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Extension Features</CardTitle>
                <CardDescription>Features available on GitHub pages</CardDescription>
              </CardHeader>
              <CardContent>
                <FeaturesList />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                <CardDescription>About this extension</CardDescription>
              </CardHeader>
              <CardContent>
                <ExtensionInfo />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Simple GitHub icon component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

export default Index;
