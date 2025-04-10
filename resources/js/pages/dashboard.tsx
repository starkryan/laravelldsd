import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { Wallet, MessageCircle, Phone, Clock, Search, Loader2, Filter, RefreshCw, Globe } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];


export default function Dashboard() {
    const { auth, countries = {}, transactions: transactionsData = [] } = usePage<SharedData & {
        countries?: Record<string, any>,
        transactions?: any
    }>().props;
    
    console.log('Countries data:', countries); // Debug log for countries
    
    // OTP Service Selection States
    const [country, setCountry] = useState('');
    const [service, setService] = useState('');
    const [operator, setOperator] = useState('any');
    const [services, setServices] = useState<Record<string, any>>({});
    const [operators, setOperators] = useState<Record<string, any>>({});
    const [price, setPrice] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Transaction History States
    const [activeTab, setActiveTab] = useState('purchase');
    
    // Ensure transactions is an array
    const transactions = Array.isArray(transactionsData) 
        ? transactionsData 
        : (transactionsData && typeof transactionsData === 'object' 
            ? Object.values(transactionsData) 
            : []);
    
    // Set default country if available
    useEffect(() => {
        if (countries && Object.keys(countries).length > 0 && !country) {
            console.log('Available countries:', Object.keys(countries)); // Debug log
            // Either select the first country or a default like 'india' if available
            const defaultCountry = Object.keys(countries).includes('india') 
                ? 'india' 
                : Object.keys(countries)[0];
            
            setCountry(defaultCountry);
        }
    }, [countries]);
    
    // Load services when country changes
    useEffect(() => {
        if (country) {
            loadServices();
        }
    }, [country]);
    
    // Load operators when service changes
    useEffect(() => {
        if (country && service) {
            loadOperators();
        }
    }, [country, service]);

    // Helper to check if countries data is ready
    const isCountriesDataReady = countries && Object.keys(countries).length > 0;
    
    const loadServices = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/otp/products', { country });
            const data = response.data;
            
            console.log('Services data:', data); // Debug log
            setServices(data);
            setService('');
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
            const response = await axios.post('/otp/prices', { 
                country, 
                product: service 
            });
            
            const data = response.data;
            
            // Ensure operators is properly structured
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
                // Reload or redirect
                router.reload();
            },
            onError: () => {
                toast.error('Failed to purchase number');
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };
    
    // Filter services based on search query
    const filteredServices = searchQuery
        ? Object.entries(services).filter(([key]) => 
            key.toLowerCase().includes(searchQuery.toLowerCase())
        ).reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
        : services;
        
    // Helper to safely render potentially complex objects
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
    
    // Function to get country name display
    const getCountryName = (code: string): string => {
        if (!countries) return code;
        const country = countries[code];
        return renderSafely(country) || code;
    };
    
    // Get transaction status badge variant
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'outline';
            case 'RECEIVED':
                return 'default';
            case 'COMPLETED':
                return 'secondary';
            case 'CANCELLED':
                return 'destructive';
            case 'EXPIRED':
                return 'secondary';
            default:
                return 'outline';
        }
    };
    
    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };
    
    // Check if purchase should be disabled
    const isPurchaseDisabled = !country || !service || !operator || isLoading || auth.user.balance < (price || 0);
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="OTP Dashboard" />
            <div className="flex flex-col gap-5 p-4 bg-background">
                {/* Balance Card */}
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 max-w-md mx-auto w-full shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="flex items-center text-lg gap-2 text-primary-foreground">
                            <Wallet className="h-5 w-5 text-primary" />
                            Your Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <p className="text-3xl font-bold">${typeof auth.user?.balance === 'number' ? auth.user.balance.toFixed(2) : '0.00'}</p>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-muted-foreground">Available for purchases</p>
                            <Button variant="outline" size="sm" asChild className="h-8 bg-white/50 hover:bg-white/80">
                                <Link href="/settings/payment">Add Funds</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Main Content with Tabs */}
                <Tabs defaultValue="purchase" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="purchase" className="text-base">Get OTP Number</TabsTrigger>
                        <TabsTrigger value="history" className="text-base">My Numbers</TabsTrigger>
                    </TabsList>
                    
                    {/* Purchase Tab */}
                    <TabsContent value="purchase" className="space-y-4">
                        <Card className="shadow-sm border-muted">
                            <CardHeader className="pb-2 bg-muted/30">
                                <CardTitle className="text-xl">Purchase OTP Number</CardTitle>
                                <CardDescription>
                                    Select country and service to receive verification codes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {/* Country Selection */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <label className="text-sm font-medium">Country</label>
                                    </div>
                                    
                                    {!isCountriesDataReady ? (
                                        <div className="flex justify-center py-4">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                <p className="text-sm text-muted-foreground">Loading countries...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <Select
                                            value={country}
                                            onValueChange={setCountry}
                                            disabled={isLoading || !isCountriesDataReady}
                                        >
                                            <SelectTrigger className="h-10 bg-background">
                                                <SelectValue placeholder="Select a country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(countries).map(([code, name]) => (
                                                    <SelectItem key={code} value={code}>
                                                        {renderSafely(name)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                
                                {/* Service Selection */}
                                {isLoading && country ? (
                                    <div className="py-8 flex justify-center items-center">
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p className="text-sm text-muted-foreground">Loading services...</p>
                                        </div>
                                    </div>
                                ) : country ? (
                                    <>
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                                    <label className="text-sm font-medium">Service</label>
                                                </div>
                                                <div className="relative w-1/2">
                                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input 
                                                        placeholder="Search services..."
                                                        className="pl-9 h-9"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-background">
                                                {Object.entries(filteredServices).length > 0 ? (
                                                    Object.entries(filteredServices).map(([key, value]) => (
                                                        <Button
                                                            key={key}
                                                            variant={service === key ? "default" : "outline"}
                                                            size="sm"
                                                            className="justify-start overflow-hidden h-10"
                                                            onClick={() => setService(key)}
                                                            disabled={isLoading}
                                                        >
                                                            <span className="truncate">{key}</span>
                                                            <Badge variant="outline" className="ml-auto bg-white/70">
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
                                                            No services available for this country
                    </div>
                                                    )
                                                )}
                    </div>
                </div>
                                        
                                        {service && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <label className="text-sm font-medium">Operator</label>
                                                </div>
                                                <Select
                                                    value={operator}
                                                    onValueChange={setOperator}
                                                    disabled={isLoading}
                                                >
                                                    <SelectTrigger className="h-10 bg-background">
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
                                ) : null}
                            </CardContent>
                            <CardFooter className="flex justify-between p-4 bg-muted/30 border-t">
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
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : isPurchaseDisabled && auth.user.balance < (price || 0) ? (
                                        "Insufficient Balance"
                                    ) : (
                                        "Buy Number"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    
                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                        <Card className="shadow-sm border-muted">
                            <CardHeader className="pb-3 bg-muted/30">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-xl">My Active Numbers</CardTitle>
                                        <CardDescription>
                                            Track your active OTP numbers and messages
                                        </CardDescription>
                                    </div>
                                    <Button variant="default" size="sm" onClick={() => setActiveTab('purchase')}>
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Get New Number
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <div className="text-center py-10">
                                        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                                        <p className="mt-2 text-lg font-medium">No active numbers</p>
                                        <p className="text-muted-foreground mt-1">
                                            You haven't purchased any OTP services yet.
                                        </p>
                                        <Button 
                                            className="mt-4"
                                            onClick={() => setActiveTab('purchase')}
                                        >
                                            Get Your First Number
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-md border overflow-hidden bg-background">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Service</TableHead>
                                                    <TableHead>Number</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.slice(0, 5).map((transaction: any) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell className="font-medium">
                                                            {transaction.service}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center">
                                                                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                                                {transaction.phone_number}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={getStatusVariant(transaction.status)}>
                                                                {transaction.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatDate(transaction.created_at)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="default" size="sm" onClick={() => {
                                                                router.visit(`/dashboard/verify/${transaction.id}`);
                                                            }}>
                                                                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                                                                Check SMS
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
