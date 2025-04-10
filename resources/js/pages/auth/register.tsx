import { Head, useForm } from '@inertiajs/react';
import { CheckCircle, LoaderCircle, AlertCircle, User, Mail, Lock, UserCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onSuccess: () => {
                toast.success('Account created successfully!', {
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    duration: 5000,
                });
            },
            onError: () => {
                toast.error('There was a problem creating your account.', {
                    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
                    duration: 5000,
                });
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <Toaster position="top-right" />
            <form className="flex flex-col gap-8" onSubmit={submit}>
                <div className="grid gap-7">
                    <div className="grid gap-3">
                        <Label htmlFor="name" className="text-xl font-semibold sm:text-2xl">Full Name</Label>
                        <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="John Doe"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.name} className="mt-1 text-lg" />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="username" className="text-xl font-semibold sm:text-2xl">Username</Label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="username"
                                type="text"
                                required
                                tabIndex={2}
                                autoComplete="username"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                disabled={processing}
                                placeholder="username123"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.username} className="text-lg" />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="email" className="text-xl font-semibold sm:text-2xl">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                required
                                tabIndex={3}
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={processing}
                                placeholder="john.doe@example.com"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.email} className="text-lg" />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="password" className="text-xl font-semibold sm:text-2xl">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder="••••••••"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.password} className="text-lg" />
                    </div>

                    <div className="grid gap-3">
                        <Label htmlFor="password_confirmation" className="text-xl font-semibold sm:text-2xl">Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="password_confirmation"
                                type="password"
                                required
                                tabIndex={5}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder="••••••••"
                                className="h-14 sm:h-16 text-lg sm:text-xl pl-14 pr-6 rounded-xl border-2 focus-visible:ring-4 focus-visible:ring-primary/20"
                            />
                        </div>
                        <InputError message={errors.password_confirmation} className="text-lg" />
                    </div>

                    <Button 
                        type="submit" 
                        className="mt-4 w-full h-14 sm:h-16 text-xl rounded-xl font-bold transition-all hover:scale-[1.01] hover:shadow-lg" 
                        tabIndex={6} 
                        disabled={processing}
                    >
                        {processing && <LoaderCircle className="h-6 w-6 animate-spin mr-3" />}
                        Create Account
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-lg sm:text-xl">
                    Already have an account?{' '}
                    <TextLink 
                        href={route('login')} 
                        tabIndex={7} 
                        className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors"
                    >
                        Log in here
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
