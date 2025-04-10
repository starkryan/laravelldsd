import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'OTP',
        href: '/otp',
    },
];

export default function OtpIndex() {
    const { auth } = usePage<SharedData>().props;
    const { countries, transactions, urlParams } = usePage<any>().props;
    
    // Debug countries data
    console.log('Countries data:', countries);

    const [isLoading, setIsLoading] = useState(false);
    const [country, setCountry] = useState('');
    const [service, setService] = useState('');
    const [operator, setOperator] = useState('any');
    const [services, setServices] = useState<Record<string, any>>({});
    const [operators, setOperators] = useState<Record<string, any>>({});
    const [price, setPrice] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Set default country if available
    useEffect(() => {
        if (countries && Object.keys(countries).length > 0 && !country) {
            // Either select the first country or a default like 'india' if available
            const defaultCountry = Object.keys(countries).includes('india') 
                ? 'india' 
                : Object.keys(countries)[0];
            
            setCountry(defaultCountry);
            console.log('Setting default country:', defaultCountry);
        }
    }, [countries]);
    
    // Get service from URL parameters if available
    useEffect(() => {
        // Get URL parameters
        const queryParams = new URLSearchParams(window.location.search);
        const serviceParam = queryParams.get('service');
        
        if (serviceParam) {
            setSearchQuery(serviceParam);
            
            // If we have a valid country already, set the service
            if (country && services[serviceParam]) {
                setService(serviceParam);
            }
        }
    }, [services]);
    
    // Filter services based on search query
    const filteredServices = searchQuery
        ? Object.entries(services).filter(([key]) => 
            key.toLowerCase().includes(searchQuery.toLowerCase())
          ).reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
        : services;
    
    useEffect(() => {
        if (country) {
            loadServices();
        }
    }, [country]);
    
    useEffect(() => {
        if (country && service) {
            loadOperators();
        }
    }, [country, service]);
    
    const loadServices = async () => {
        setIsLoading(true);
        console.log('Loading services for country:', country);
        try {
            // Use axios which automatically includes the CSRF token
            console.log('Making request to:', '/otp/products');
            const response = await axios.post('/otp/products', { country });
            console.log('Services response:', response.data);
            const data = response.data;
            
            setServices(data);
            
            // If we have a service in the URL and it's available, select it
            const queryParams = new URLSearchParams(window.location.search);
            const serviceParam = queryParams.get('service');
            if (serviceParam && data[serviceParam]) {
                console.log('Setting service from URL:', serviceParam);
                setService(serviceParam);
            } else {
                setService('');
            }
            
            setOperator('any');
        } catch (error) {
            console.error('Error loading services:', error);
            toast.error('Failed to load services');
        } finally {
            setIsLoading(false);
        }
    };
    
    const loadOperators = async () => {
        setIsLoading(true);
        try {
            // Use axios which automatically includes the CSRF token
            const response = await axios.post('/otp/prices', { 
                country, 
                product: service 
            });
            
            const data = response.data;
            
            // Ensure operators is properly structured and handle potential object properties
            const operatorData = data[country]?.[service] || {};
            setOperators(operatorData);
            setOperator('any');
            
            // Get price from service list
            setPrice(services[service]?.Price || null);
        } catch (error) {
            console.error('Error loading operators:', error);
            toast.error('Failed to load operators');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePurchase = () => {
        if (auth.user.balance < (price || 0)) {
            toast.error('Insufficient balance. Please add funds to your account.');
            return;
        }
        
        setIsLoading(true);
        
        // Use Inertia's router.post which already handles CSRF protection
        router.post('/otp/purchase', {
            country,
            operator,
            product: service,
        }, {
            onSuccess: () => {
                toast.success('Number purchased successfully!');
            },
            onError: () => {
                toast.error('Failed to purchase number');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };
    
    const isPurchaseDisabled = !country || !service || !operator || isLoading || auth.user.balance < (price || 0);
    
    // Helper function to safely render potentially complex objects
    const renderSafely = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (typeof value === 'object') {
            if (value.name) return value.name;
            if (value.text_en) return value.text_en;
            if (value.iso) return value.iso;
            return JSON.stringify(value);
        }
        return String(value);
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="OTP Number Service" />
            
            <div className="container max-w-7xl pb-10">
                <div className="flex flex-col space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-2/3 flex flex-col space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold">Purchase OTP Number</CardTitle>
                                    <CardDescription>
                                        Select a country, service, and operator to receive verification codes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Country</label>
                                        <Select
                                            value={country}
                                            onValueChange={setCountry}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select a country">
                                                    {isLoading && !country && (
                                                        <div className="flex items-center">
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            Loading...
                                                        </div>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(countries || {}).map(([code, name]) => (
                                                    <SelectItem key={code} value={code}>
                                                        {renderSafely(name)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    {isLoading && country && (
                                        <div className="py-8 flex justify-center items-center">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                <p className="text-sm text-muted-foreground">Loading services...</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!isLoading && country && (
                                        <>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium">Service</label>
                                                    <div className="relative w-1/2">
                                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input 
                                                            placeholder="Search services..."
                                                            className="pl-9"
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                                    {Object.entries(filteredServices).length > 0 ? (
                                                        Object.entries(filteredServices).map(([key, value]) => (
                                                            <Button
                                                                key={key}
                                                                variant={service === key ? "default" : "outline"}
                                                                size="sm"
                                                                className="justify-start overflow-hidden"
                                                                onClick={() => setService(key)}
                                                                disabled={isLoading}
                                                            >
                                                                <span className="truncate">{key}</span>
                                                                <Badge variant="outline" className="ml-auto">
                                                                    ${(value as any).Price}
                                                                </Badge>
                                                            </Button>
                                                        ))
                                                    ) : (
                                                        searchQuery ? (
                                                            <div className="col-span-full p-4 text-center text-muted-foreground">
                                                                No services match your search
                                                            </div>
                                                        ) : (
                                                            <div className="col-span-full p-4 text-center text-muted-foreground">
                                                                {isLoading ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                                        Loading services...
                                                                    </div>
                                                                ) : (
                                                                    'No services available for this country'
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {service && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Operator</label>
                                                    <Select
                                                        value={operator}
                                                        onValueChange={setOperator}
                                                        disabled={isLoading}
                                                    >
                                                        <SelectTrigger className="h-12">
                                                            <SelectValue placeholder="Select an operator" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="any">Any Operator</SelectItem>
                                                            {Object.keys(operators).map((op) => (
                                                                <SelectItem key={op} value={op}>
                                                                    {renderSafely(op)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    
                                    {price !== null && (
                                        <div className="pt-2">
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Purchase Info</AlertTitle>
                                                <AlertDescription className="flex justify-between items-center">
                                                    <span>Price: <strong>${price}</strong></span>
                                                    <span>Your Balance: <strong>${auth.user.balance}</strong></span>
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <div>
                                        {price !== null && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">Price:</span>
                                                <Badge variant="secondary" className="text-lg">
                                                    ${price}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        onClick={handlePurchase}
                                        disabled={isPurchaseDisabled}
                                        className="w-full sm:w-auto"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : isPurchaseDisabled && auth.user.balance < (price || 0) ? (
                                            "Insufficient Balance"
                                        ) : (
                                            "Purchase Number"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                        
                        <div className="md:w-1/3 flex flex-col space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex justify-between items-center">
                                        Active Transactions
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.reload()}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {transactions && transactions.length > 0 ? (
                                        <div className="space-y-4">
                                            {transactions.map((transaction: any) => (
                                                <div key={transaction.id} className="flex flex-col space-y-2 p-4 border rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium">{renderSafely(transaction.service)}</div>
                                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <span>{transaction.phone_number}</span>
                                                                <span className="text-xs">•</span>
                                                                <span>
                                                                    {renderSafely(transaction.country)}/{renderSafely(transaction.operator)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Badge variant={transaction.status === 'COMPLETED' ? 'secondary' : 
                                                                      transaction.status === 'PENDING' ? 'outline' : 
                                                                      transaction.status === 'CANCELLED' ? 'destructive' : 'default'}>
                                                            {transaction.status}
                                                        </Badge>
                                                    </div>
                                                    
                                                    {transaction.sms_text && (
                                                        <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                                                            <div className="font-medium mb-1">SMS Text:</div>
                                                            <div>{transaction.sms_text}</div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">
                                                            {new Date(transaction.created_at).toLocaleString()}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">${transaction.price}</Badge>
                                                            {transaction.status === 'PENDING' && (
                                                                <Link href={`/otp/verify/${transaction.id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                                        Check Status
                                                                    </Button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground">
                                            No active transactions
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/otp/history">View Transaction History</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 