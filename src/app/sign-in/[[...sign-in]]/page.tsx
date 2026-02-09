import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-wusha-sand">
            <div className="w-full max-w-md">
                <SignIn />
            </div>
        </div>
    );
}
