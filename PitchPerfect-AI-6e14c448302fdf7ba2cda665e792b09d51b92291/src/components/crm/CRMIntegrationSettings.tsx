
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Settings, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CRMProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  isConnected: boolean;
  apiUrl?: string;
  authType: 'oauth' | 'api_key' | 'webhook';
}

const CRMIntegrationSettings: React.FC = () => {
  const [providers, setProviders] = useState<CRMProvider[]>([
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync leads and track sales performance',
      logo: '🔶',
      isConnected: false,
      authType: 'oauth'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Enterprise CRM integration',
      logo: '☁️',
      isConnected: false,
      authType: 'oauth'
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales pipeline management',
      logo: '🔵',
      isConnected: false,
      authType: 'api_key'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 5000+ apps via webhooks',
      logo: '⚡',
      isConnected: false,
      authType: 'webhook'
    }
  ]);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectionData, setConnectionData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load saved connections from localStorage
    const savedConnections = localStorage.getItem('crm_connections');
    if (savedConnections) {
      try {
        const connections = JSON.parse(savedConnections);
        setProviders(prev => prev.map(provider => ({
          ...provider,
          isConnected: !!connections[provider.id]
        })));
      } catch (error) {
        console.error('Error loading CRM connections:', error);
      }
    }
  }, []);

  const handleConnect = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      if (provider.authType === 'oauth') {
        // Simulate OAuth flow
        const authUrl = `https://api.${provider.id}.com/oauth/authorize?client_id=demo&redirect_uri=${window.location.origin}/auth/callback`;
        window.open(authUrl, '_blank', 'width=600,height=600');
        
        // Simulate successful connection after delay
        setTimeout(() => {
          updateConnectionStatus(providerId, true);
          toast({
            title: "Integration Connected",
            description: `Successfully connected to ${provider.name}`,
          });
        }, 2000);
      } else if (provider.authType === 'api_key') {
        const apiKey = connectionData[`${providerId}_api_key`];
        if (!apiKey) {
          toast({
            title: "API Key Required",
            description: "Please enter your API key",
            variant: "destructive",
          });
          return;
        }
        
        // Validate API key (simulation)
        if (apiKey.length < 10) {
          toast({
            title: "Invalid API Key",
            description: "API key appears to be invalid",
            variant: "destructive",
          });
          return;
        }
        
        updateConnectionStatus(providerId, true);
        saveConnectionData(providerId, { apiKey });
        toast({
          title: "Integration Connected",
          description: `Successfully connected to ${provider.name}`,
        });
      } else if (provider.authType === 'webhook') {
        const webhookUrl = connectionData[`${providerId}_webhook`];
        if (!webhookUrl) {
          toast({
            title: "Webhook URL Required",
            description: "Please enter your webhook URL",
            variant: "destructive",
          });
          return;
        }
        
        updateConnectionStatus(providerId, true);
        saveConnectionData(providerId, { webhookUrl });
        toast({
          title: "Webhook Connected",
          description: `Successfully configured ${provider.name} webhook`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to CRM. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = (providerId: string) => {
    updateConnectionStatus(providerId, false);
    removeConnectionData(providerId);
    
    const provider = providers.find(p => p.id === providerId);
    toast({
      title: "Integration Disconnected",
      description: `Disconnected from ${provider?.name}`,
    });
  };

  const updateConnectionStatus = (providerId: string, isConnected: boolean) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, isConnected } : provider
    ));
  };

  const saveConnectionData = (providerId: string, data: Record<string, string>) => {
    const connections = JSON.parse(localStorage.getItem('crm_connections') || '{}');
    connections[providerId] = data;
    localStorage.setItem('crm_connections', JSON.stringify(connections));
  };

  const removeConnectionData = (providerId: string) => {
    const connections = JSON.parse(localStorage.getItem('crm_connections') || '{}');
    delete connections[providerId];
    localStorage.setItem('crm_connections', JSON.stringify(connections));
  };

  const testConnection = async (providerId: string) => {
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Connection Test Successful",
        description: "Your CRM integration is working properly",
      });
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Unable to connect to your CRM",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">CRM Integrations</h2>
        <p className="text-gray-600">Connect PitchPerfect AI to your existing CRM system</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          CRM integrations sync your practice sessions and performance data to help track real-world impact.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.logo}</span>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.isConnected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Connected</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {!provider.isConnected ? (
                <div className="space-y-4">
                  {provider.authType === 'api_key' && (
                    <div>
                      <Label htmlFor={`${provider.id}_api_key`}>API Key</Label>
                      <Input
                        id={`${provider.id}_api_key`}
                        type="password"
                        placeholder="Enter your API key"
                        value={connectionData[`${provider.id}_api_key`] || ''}
                        onChange={(e) => setConnectionData(prev => ({
                          ...prev,
                          [`${provider.id}_api_key`]: e.target.value
                        }))}
                      />
                    </div>
                  )}
                  
                  {provider.authType === 'webhook' && (
                    <div>
                      <Label htmlFor={`${provider.id}_webhook`}>Webhook URL</Label>
                      <Input
                        id={`${provider.id}_webhook`}
                        type="url"
                        placeholder="https://hooks.zapier.com/..."
                        value={connectionData[`${provider.id}_webhook`] || ''}
                        onChange={(e) => setConnectionData(prev => ({
                          ...prev,
                          [`${provider.id}_webhook`]: e.target.value
                        }))}
                      />
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => handleConnect(provider.id)}
                    className="w-full"
                  >
                    {provider.authType === 'oauth' ? 'Connect with OAuth' : 'Connect'}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => testConnection(provider.id)}
                    size="sm"
                  >
                    Test Connection
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedProvider(provider.id)}
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDisconnect(provider.id)}
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CRMIntegrationSettings;
