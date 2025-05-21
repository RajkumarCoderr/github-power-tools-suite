
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKeyFormProps {
  apiKey: string;
  onSave: (key: string) => void;
  disabled?: boolean;
}

export const ApiKeyForm = ({ apiKey, onSave, disabled = false }: ApiKeyFormProps) => {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(inputValue);
  };
  
  const defaultToken = "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";
  const useDefaultToken = () => {
    setInputValue(defaultToken);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="font-medium">GitHub API Key</label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your GitHub API token"
            className="pr-16"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        <Button type="submit" disabled={!inputValue || disabled}>Save</Button>
      </div>
      <div className="text-sm flex justify-between mt-2">
        <button 
          type="button"
          onClick={useDefaultToken}
          className="text-blue-500 hover:underline"
          disabled={disabled}
        >
          Use Sample API Key
        </button>
        <a 
          href="https://github.com/settings/tokens/new" 
          target="_blank" 
          rel="noreferrer"
          className="text-blue-500 hover:underline"
        >
          Get API Key
        </a>
      </div>
      
      <div className="text-xs text-muted-foreground mt-1">
        Your API key is stored locally and is only used to access GitHub API
      </div>
    </form>
  );
};
