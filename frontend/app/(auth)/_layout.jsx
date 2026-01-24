import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "../../hooks/useAuth"
import GuestOnly from "../../components/auth/guestOnly"

const AuthLayout = () => {
  const { user } = useAuth()  // Now using useAuth

  return (
    <GuestOnly>
      <StatusBar value="auto"/>
      <Stack 
        screenOptions={{ headerShown: false, animation: 'none'}}
      />
    </GuestOnly>
  )
}

export default AuthLayout