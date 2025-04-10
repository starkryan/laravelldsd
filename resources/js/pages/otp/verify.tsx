import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, Loader2, MessageSquare, Phone, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'OTP',
        href: '/otp',
    },
    {
        title: 'Verify',
        href: '#',
    },
];

export default function OtpVerify() {
    const { transaction } = usePage<any>().props;
    
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(true);
    const [updatedTransaction, setUpdatedTransaction] = useState(transaction);
    const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);
    
    // Calculate time left and progress
    useEffect(() => {
        const calculateTimeLeft = () => {
            const expiresAt = new Date(transaction.expires_at).getTime();
            const now = new Date().getTime();
            const difference = expiresAt - now;
            
            if (difference <= 0) {
                setTimeLeft(0);
                setProgress(0);
                setIsPolling(false);
                return;
            }
            
            // Calculate minutes and seconds
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            setTimeLeft(minutes * 60 + seconds);
            
            // Calculate total duration and progress
            const createdAt = new Date(transaction.created_at).getTime();
            const totalDuration = expiresAt - createdAt;
            const elapsed = now - createdAt;
            const remainingPercent = Math.max(0, Math.min(100, 100 - (elapsed / totalDuration) * 100));
            setProgress(remainingPercent);
        };
        
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, [transaction]);
    
    // Poll for SMS
    useEffect(() => {
        if (!isPolling || timeLeft === 0 || updatedTransaction.sms_text) {
            return;
        }
        
        const pollSms = async () => {
            setIsLoading(true);
            try {
                // Use axios instead of fetch - it automatically handles CSRF tokens
                const response = await axios.post(`/otp/check-sms/${transaction.id}`);
                const data = response.data;
                
                // Log data for debugging
                console.log('SMS check response:', data);
                
                setUpdatedTransaction(data.transaction);
                
                if (data.has_sms) {
                    setIsPolling(false);
                    toast.success('SMS received!');
                }
            } catch (error) {
                console.error('Error checking SMS status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        pollSms();
        const interval = setInterval(pollSms, 5000); // Poll every 5 seconds
        
        return () => {
            clearInterval(interval);
        };
    }, [isPolling, timeLeft, updatedTransaction, transaction.id]);
    
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    
    const handleCancelPurchase = () => {
        if (confirm('Are you sure you want to cancel this purchase? You will be refunded.')) {
            setIsLoading(true);
            axios.post(`/otp/cancel/${transaction.id}`)
                .then(response => {
                    toast.success('Purchase cancelled successfully');
                    router.visit(`/otp`);
                })
                .catch(error => {
                    console.error('Error cancelling purchase:', error);
                    toast.error('Failed to cancel purchase');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    };
    
    const handleFinishPurchase = () => {
        setIsLoading(true);
        axios.post(`/otp/finish/${transaction.id}`)
            .then(response => {
                toast.success('Purchase completed');
                router.visit(`/otp`);
            })
            .catch(error => {
                console.error('Error completing purchase:', error);
                toast.error('Failed to complete purchase');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Verify - ${transaction.service}`} />
            
            <div className="container max-w-4xl pb-10">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold">
                                {transaction.service} Verification
                            </CardTitle>
                            <Badge variant={updatedTransaction.status === 'RECEIVED' ? 'default' : 'outline'}>
                                {updatedTransaction.status}
                            </Badge>
                        </div>
                        <CardDescription className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-1" />
                            {transaction.phone_number} • {transaction.country} • {transaction.operator}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
                        {timeLeft > 0 && !updatedTransaction.sms_text && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        Time remaining: {formatTime(timeLeft)}
                                    </span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        )}
                        
                        {timeLeft === 0 && !updatedTransaction.sms_text && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Time Expired</AlertTitle>
                                <AlertDescription>
                                    The time limit for this number has expired. No SMS was received.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-lg flex items-center">
                                    <MessageSquare className="h-5 w-5 mr-2" />
                                    SMS Content
                                </h3>
                                
                                {!updatedTransaction.sms_text && (
                                    <div className="flex items-center gap-2">
                                        {isPolling && (
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                Waiting for SMS...
                                            </div>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => {
                                                // Manual check for SMS
                                                setIsLoading(true);
                                                axios.post(`/otp/check-sms/${transaction.id}`)
                                                    .then(response => {
                                                        const data = response.data;
                                                        console.log('Manual SMS check response:', data);
                                                        setUpdatedTransaction(data.transaction);
                                                        
                                                        if (data.has_sms) {
                                                            setIsPolling(false);
                                                            toast.success('SMS received!');
                                                        } else {
                                                            toast.info('No SMS received yet. Still waiting...');
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Error checking SMS:', error);
                                                        toast.error('Failed to check SMS status');
                                                    })
                                                    .finally(() => {
                                                        setIsLoading(false);
                                                    });
                                            }}
                                            disabled={isLoading}
                                        >
                                            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                                            Check Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                            {/* SMS text value: {JSON.stringify(Boolean(updatedTransaction.sms_text))} */}
                            
                            {updatedTransaction.sms_text ? (
                                <div className="bg-muted/50 p-4 rounded-md font-mono text-md break-words">
                                    <div className="bg-green-50 dark:bg-green-950/20 p-3 mb-3 rounded border-l-4 border-green-500">
                                        <div className="font-medium text-green-800 dark:text-green-400 mb-1">SMS Received!</div>
                                        <div className="text-sm text-green-600 dark:text-green-300">
                                            {updatedTransaction.sms_received_at ? 
                                                `Received at: ${new Date(updatedTransaction.sms_received_at).toLocaleString()}` : 
                                                'Processing...'}
                                        </div>
                                    </div>
                                    <div className="whitespace-pre-wrap">{updatedTransaction.sms_text}</div>
                                </div>
                            ) : (
                                <div className="bg-muted/50 p-4 rounded-md text-center text-muted-foreground h-24 flex items-center justify-center">
                                    {isPolling ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="h-5 w-5 animate-spin mb-2" />
                                            <span>Waiting to receive SMS...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <X className="h-6 w-6 mb-2" />
                                            <span>No SMS received</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {updatedTransaction.sms_text && (
                            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>SMS Received</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    Received at: {new Date(updatedTransaction.sms_received_at).toLocaleString()}
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="bg-muted/30 p-4 rounded-md grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground mb-1">Price</div>
                                <div className="font-medium">${transaction.price}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground mb-1">Purchased</div>
                                <div className="font-medium">{new Date(transaction.created_at).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground mb-1">Expires</div>
                                <div className="font-medium">{new Date(transaction.expires_at).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground mb-1">Transaction ID</div>
                                <div className="font-medium truncate">{transaction.transaction_id}</div>
                            </div>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col sm:flex-row gap-3 bg-muted/30 p-6">
                        <Button
                            variant="outline" 
                            className="w-full"
                            asChild
                        >
                            <Link href="/otp">Back to OTP Services</Link>
                        </Button>
                        
                        {updatedTransaction.status === 'RECEIVED' ? (
                            <Button
                                className="w-full"
                                onClick={handleFinishPurchase}
                                disabled={isLoading}
                            >
                                Finish Order
                            </Button>
                        ) : (
                            timeLeft > 0 && !updatedTransaction.sms_text && (
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={handleCancelPurchase}
                                    disabled={isLoading}
                                >
                                    Cancel & Refund
                                </Button>
                            )
                        )}
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
} 