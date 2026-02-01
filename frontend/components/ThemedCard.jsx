import { StyleSheet, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/Colors';

const ThemedCard = ({ style, elevated = true, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <View 
      style={[
        { 
          backgroundColor: theme.cardBackground,
          shadowColor: elevated ? '#000' : 'transparent',
          shadowOffset: elevated ? { width: 0, height: 5 } : { width: 0, height: 0 },
          shadowOpacity: elevated ? 0.1 : 0,
          shadowRadius: elevated ? 15 : 0,
          elevation: elevated ? 8 : 0,
        }, 
        styles.card, 
        style
      ]}
      {...props}
    />
  );
};

export default ThemedCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
  }
});