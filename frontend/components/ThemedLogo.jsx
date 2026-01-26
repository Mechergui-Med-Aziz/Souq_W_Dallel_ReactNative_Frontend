import { Image, useColorScheme } from 'react-native'

// images
import DarkLogo from '../assets/img/auction.png'
import LightLogo from '../assets/img/auction.png'

const ThemedLogo = ({ ...props }) => {
    const colorScheme = useColorScheme()

    const logo = colorScheme === 'dark' ? DarkLogo : LightLogo

    return (
        <Image source={logo} {...props} />
    )
}

export default ThemedLogo