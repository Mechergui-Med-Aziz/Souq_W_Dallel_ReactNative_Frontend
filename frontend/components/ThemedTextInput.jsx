import { useState } from 'react';
import { useTheme } from '../constants/ThemeContext';
import { TextInput, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

const ThemedTextInput = ({ style, icon, secureTextEntry, ...props }) => {
  const { colorScheme } = useTheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[
      styles.wrapper,
      {
        backgroundColor: theme.inputBackground,
        borderColor: isFocused ? Colors.primary : theme.borderColor,
        borderWidth: isFocused ? 1.5 : 1,
      },
      style
    ]}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={isFocused ? Colors.primary : theme.mutedText}
          style={styles.icon}
        />
      )}
      <TextInput
        style={[
          styles.input,
          {
            color: theme.title,
            paddingLeft: icon ? 0 : 4,
          },
        ]}
        placeholderTextColor={theme.mutedText}
        secureTextEntry={hidePassword}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setHidePassword(!hidePassword)}
          style={styles.eyeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.mutedText}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  eyeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default ThemedTextInput;