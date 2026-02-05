import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "../../hooks/useAuth"
import AuthGuard from "../../components/auth/AuthGuard"

const AuthLayout = () => {
  const { user } = useAuth()

  return (
    <AuthGuard guestOnly redirectTo="/">
      <StatusBar value="auto"/>
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          animation: 'none',
        }}
      />
    </AuthGuard>
  )
}

export default AuthLayout