import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onSuccess: () => {
                toast.success('Logged in successfully!', {
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    duration: 5000,
                });
            },
            onError: () => {
                toast.error('Invalid credentials. Please try again.', {
                    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
                    duration: 5000,
                });
            },
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />
            <Toaster position="top-right" />
            
            {status && <div className="mb-6 text-center text-lg font-medium text-green-600 bg-green-50 p-4 rounded-xl">{status}</div>}

            <form className="flex flex-col gap-8" onSubmit={submit}>
                <div className="grid gap-7">
                    <div className="grid gap-3">
                        <Label htmlFor="email" className="text-xl font-semibold sm:text-2xl">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="john.doe@example.com"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.email} className="text-lg" />
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-xl font-semibold sm:text-2xl">Password</Label>
                            {canResetPassword && (
                                <TextLink 
                                    href={route('password.request')} 
                                    className="text-lg font-medium sm:text-xl hover:text-primary transition-colors" 
                                    tabIndex={5}
                                >
                                    Forgot password?
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.password} className="text-lg" />
                    </div>

                    <div className="flex items-center space-x-3 mt-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                            className="h-6 w-6 rounded-md border-2"
                        />
                        <Label htmlFor="remember" className="text-lg font-medium sm:text-xl">Remember me</Label>
                    </div>

                    <Button 
                        type="submit" 
                        className="mt-4 w-full h-14 sm:h-16 text-xl rounded-xl font-bold transition-all hover:scale-[1.01] hover:shadow-lg" 
                        tabIndex={4} 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-6 w-6 animate-spin mr-3" />}
                        Log in
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-lg sm:text-xl">
                    Don't have an account?{' '}
                    <TextLink 
                        href={route('register')} 
                        tabIndex={6} 
                        className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors"
                    >
                        Sign up here
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
