import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Clock, Search, Phone, MessageSquare } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    {
        title: 'OTP',
        href: '/otp',
    },
    {
        title: 'History',
        href: '#',
    },
];

interface Transaction {
    id: number;
    user_id: number;
    transaction_id: string;
    service: string;
    phone_number: string;
    country: string | {
        iso?: string;
        text_en?: string;
        prefix?: string;
        [key: string]: any;
    };
    operator: string | {
        name?: string;
        [key: string]: any;
    };
    price: string;
    status: string;
    sms_text: string | null;
    sms_received_at: string | null;
    created_at: string;
    expires_at: string;
}

export default function OtpHistory() {
    const { transactions: transactionsData } = usePage<{ transactions: any }>().props;
    const [searchQuery, setSearchQuery] = useState('');
    
    // Ensure transactions is an array - handle various formats
    let transactions = [];
    
    if (Array.isArray(transactionsData)) {
        transactions = transactionsData;
    } else if (transactionsData && typeof transactionsData === 'object') {
        // If it's an object but not an array, try to convert it to an array
        try {
            // Check if it's an object with numeric keys (like {0: {...}, 1: {...}})
            const values = Object.values(transactionsData);
            if (values.length > 0 && typeof values[0] === 'object') {
                transactions = values;
            }
        } catch (error) {
            console.error('Error processing transactions data:', error);
        }
    }
    
    // Log for debugging
    console.log('Transactions type:', typeof transactionsData, 'isArray:', Array.isArray(transactionsData));
    console.log('Processed transactions array length:', transactions.length);
    
    const filteredTransactions = transactions.filter(transaction => {
        const query = searchQuery.toLowerCase();
        try {
            // Handle undefined or null transaction
            if (!transaction) return false;
            
            // Handle missing properties safely
            const service = transaction.service?.toLowerCase() || '';
            const phoneNumber = transaction.phone_number || '';
            const status = transaction.status?.toLowerCase() || '';
            const smsText = transaction.sms_text?.toLowerCase() || '';
            
            const countryStr = typeof transaction.country === 'string' 
                ? transaction.country.toLowerCase() 
                : (transaction.country?.text_en || transaction.country?.iso || '').toLowerCase();
                
            const operatorStr = typeof transaction.operator === 'string' 
                ? transaction.operator.toLowerCase() 
                : (transaction.operator?.name || '').toLowerCase();
                
            return (
                service.includes(query) ||
                phoneNumber.includes(query) ||
                countryStr.includes(query) ||
                operatorStr.includes(query) ||
                status.includes(query) ||
                smsText.includes(query)
            );
        } catch (error) {
            console.error('Error filtering transaction:', transaction, error);
            return false;
        }
    });
    
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
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="OTP History" />
            
            <div className="container pb-10">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                                <CardDescription>
                                    View your past OTP purchases and their statuses
                                </CardDescription>
                            </div>
                            
                            <div className="w-full md:w-64">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-10">
                                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                                <p className="mt-2 text-lg font-medium">No transactions found</p>
                                <p className="text-muted-foreground mt-1">
                                    {transactions.length === 0
                                        ? "You haven't purchased any OTP services yet."
                                        : "No transactions match your search criteria."}
                                </p>
                                {transactions.length === 0 && (
                                    <Button asChild className="mt-4">
                                        <Link href="/otp">Purchase OTP Service</Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Service</TableHead>
                                            <TableHead>Phone Number</TableHead>
                                            <TableHead>Country/Operator</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((transaction) => (
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
                                                    {typeof transaction.country === 'object' 
                                                        ? (transaction.country?.text_en || transaction.country?.iso || 'Unknown')
                                                        : transaction.country || 'Unknown'}
                                                    /
                                                    {typeof transaction.operator === 'object'
                                                        ? (transaction.operator?.name || 'Unknown')
                                                        : transaction.operator || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(transaction.status)}>
                                                        {transaction.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>${transaction.price}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatDate(transaction.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.status !== 'COMPLETED' && transaction.status !== 'CANCELLED' ? (
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/otp/verify/${transaction.id}`}>
                                                                View
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        transaction.sms_text && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/otp/verify/${transaction.id}`}>
                                                                    Details
                                                                </Link>
                                                            </Button>
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 