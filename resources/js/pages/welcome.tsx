import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/ui/animated-hero';
import { Footerdemo } from "@/components/ui/footer-section";
import { Header1 } from '@/components/ui/header';
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut } from 'lucide-react';

// Define user type
interface User {
    name: string;
    profile_photo_url?: string;
}

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as User | undefined;

    const UserSection = () => {
        if (user) {
            // User is logged in, show avatar with dropdown menu
            const initials = user.name
                ? user.name.split(' ').map((n: string) => n[0]).join('')
                : 'U';
                
            return (
                <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-10 w-10 cursor-pointer border-2 border-primary hover:shadow-md transition-all">
                                {user.profile_photo_url && 
                                    <AvatarImage src={user.profile_photo_url} alt={user.name} />
                                }
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="font-medium">
                                <UserCircle className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={route('logout')} method="post" as="button" className="w-full flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        } else {
            // User is not logged in, show login and register links
            return (
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="font-medium">
                        <Link href={route('login')}>Login</Link>
                    </Button>
                    <Button asChild size="sm" className="font-medium">
                        <Link href={route('register')}>Register</Link>
                    </Button>
                </div>
            );
        }
    };

    return (
        <>
            <Header1 />
            <UserSection />
            <Hero />
            <Footerdemo />
        </>
    );
}
