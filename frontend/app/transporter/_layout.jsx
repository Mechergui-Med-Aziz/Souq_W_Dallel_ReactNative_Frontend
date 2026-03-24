import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useAuth } from "../../hooks/useAuth"
import AuthGuard from "../../components/auth/AuthGuard"
import { View, StyleSheet } from "react-native"
import { Colors } from "../../constants/Colors"
import { useColorScheme } from "react-native"

const TransporterLayout = () => {
  const { user } = useAuth()
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <AuthGuard userOnly allowedRoles={['Transporter']} redirectTo="/">
      <StatusBar style="auto"/>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack 
          screenOptions={{ 
            headerShown: false, 
            animation: 'none',
          }}
        />
      </View>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TransporterLayout;