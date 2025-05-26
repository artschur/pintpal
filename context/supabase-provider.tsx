import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";
import { SplashScreen, useRouter, usePathname } from "expo-router";

import { Session } from "@supabase/supabase-js";

import { supabase } from "@/config/supabase";

SplashScreen.preventAutoHideAsync();

type AuthState = {
	initialized: boolean;
	session: Session | null;
	signUp: (email: string, password: string, username: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState>({
	initialized: false,
	session: null,
	signUp: async () => {},
	signIn: async () => {},
	signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: PropsWithChildren) {
	const [initialized, setInitialized] = useState(false);
	const [session, setSession] = useState<Session | null>(null);
	const router = useRouter();
	const pathname = usePathname();

	const signUp = async (email: string, password: string, username: string) => {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					username,
				},
			},
		});

		if (error) {
			console.error("Error signing up:", error);
			return;
		}

		if (data.session) {
			setSession(data.session);
		} else {
		}
	};

	const signIn = async (email: string, password: string) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("Error signing in:", error);
			return;
		}

		if (data.session) {
			setSession(data.session);
		} else {
		}
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Error signing out:", error);
			return;
		} else {
		}
	};

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		setInitialized(true);
	}, []);

	useEffect(() => {
		if (initialized) {
			SplashScreen.hideAsync();

			// Check if user is on an invite page before redirecting
			const isInvitePage =
				pathname?.startsWith("/invite/") ||
				pathname?.includes("/group/invite/");

			if (session) {
				// User is authenticated - redirect to main app if they're on welcome/auth pages
				if (
					pathname === "/welcome" ||
					pathname === "/sign-in" ||
					pathname === "/sign-up"
				) {
					router.replace("/(protected)/(tabs)");
				}
			} else {
				// User is not authenticated - only redirect if NOT on invite page
				if (
					!isInvitePage &&
					pathname !== "/welcome" &&
					pathname !== "/sign-in" &&
					pathname !== "/sign-up"
				) {
					router.replace("/welcome");
				}
			}
		}
	}, [initialized, session, pathname]);

	return (
		<AuthContext.Provider
			value={{
				initialized,
				session,
				signUp,
				signIn,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
