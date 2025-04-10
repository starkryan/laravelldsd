import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>

            <div className="flex min-h-screen flex-col bg-background">
                <header className="container z-40 bg-background max-w-full px-6 lg:px-10">
                    <div className="flex h-24 items-center justify-between py-8">
                        <div className="flex gap-6 md:gap-10">
                            <Link href="/" className="items-center space-x-2 flex">
                                <span className="font-bold text-xl md:text-2xl">My OTP</span>
                            </Link>
                        </div>
                        <nav className="flex items-center gap-5">
                            {auth.user ? (
                                <Link href={route('dashboard')}>
                                    <Button variant="ghost" className="text-base px-6 py-6">Dashboard</Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')}>
                                        <Button variant="ghost" className="text-base px-6 py-6">Sign In</Button>
                                    </Link>
                                    <Link href={route('register')}>
                                        <Button className="text-base px-6 py-6">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </nav>
                    </div>
                </header>
                <main className="flex-1">
                    <section className="space-y-10 pb-12 pt-10 md:pb-16 md:pt-14 lg:py-36 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                        <div className="container flex max-w-7xl flex-col items-center gap-8 text-center px-4 sm:px-6 lg:px-8 w-full">
                            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                                Secure your accounts with <span className="text-primary">My OTP</span>
                            </h1>
                            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-8 md:text-2xl">
                                Generate and manage one-time passwords for all your important accounts.
                                Simple, secure, and reliable authentication at your fingertips.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto justify-center">
                                <Link href={route('register')} className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full px-8 py-6 text-lg sm:text-xl">Get Started</Button>
                                </Link>
                                <Link href={route('login')} className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full px-8 py-6 text-lg sm:text-xl">Sign In</Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                    <section className="container max-w-7xl space-y-10 py-16 md:py-20 lg:py-32 px-6 lg:px-10 w-full">
                        <div className="mx-auto grid w-full justify-center gap-8 sm:grid-cols-2 md:grid-cols-3">
                            <Card className="p-2">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl">Secure Authentication</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg">Add an extra layer of security to your online accounts with one-time passwords.</p>
                                </CardContent>
                            </Card>
                            <Card className="p-2">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl">Easy Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg">Manage all your OTP tokens in one place with our intuitive interface.</p>
                                </CardContent>
                            </Card>
                            <Card className="p-2">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-2xl">Quick Access</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg">Generate codes quickly whenever you need them, on any device.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                    </main>
                <footer className="container max-w-full py-8 md:py-10 px-6 lg:px-10 border-t">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row w-full">
                        <p className="text-center text-base leading-loose text-muted-foreground md:text-left">
                            &copy; {new Date().getFullYear()} My OTP. All rights reserved.
                        </p>
                </div>
                </footer>
            </div>
        </>
    );
}
