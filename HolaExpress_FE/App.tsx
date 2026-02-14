import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import StoreDetailScreen from './src/screens/StoreDetailScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import CartScreen from './src/screens/CartScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MenuScreen from './src/screens/MenuScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import AddressListScreen from './src/screens/AddressListScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import WalletScreen from './src/screens/WalletScreen';
import TopUpScreen from './src/screens/TopUpScreen';
import WithdrawScreen from './src/screens/WithdrawScreen';
import PaymentQRScreen from './src/screens/PaymentQRScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import SupportScreen from './src/screens/SupportScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import AboutScreen from './src/screens/AboutScreen';
import VouchersScreen from './src/screens/VouchersScreen';
import SplashScreen from './src/components/SplashScreen';
import BottomTabBar from './src/components/BottomTabBar';
import OwnerDashboard from './src/screens/OwnerDashboard';
import ManageStore from './src/screens/Owner/ManageStore';
import ManageProduct from './src/screens/Owner/ManageProduct';
import ManageOrders from './src/screens/Owner/ManageOrders';
import RevenueReport from './src/screens/Owner/RevenueReport';
import ManagePromotions from './src/screens/Owner/ManagePromotions';
import ShipperDashboard from './src/screens/ShipperDashboard';
import WorkLocation from './src/screens/Shipper/WorkLocation';
import AvailableOrders from './src/screens/Shipper/AvailableOrders';
import MyOrders from './src/screens/Shipper/MyOrders';
import DeliveryHistory from './src/screens/Shipper/DeliveryHistory';
import AdminDashboard from './src/screens/AdminDashboard';
import ManageUsers from './src/screens/Admin/ManageUsers';
import ManageOwners from './src/screens/Admin/ManageOwners';
import ManageShippers from './src/screens/Admin/ManageShippers';
import UserAccess from './src/screens/Admin/UserAccess';
import FeesSettings from './src/screens/Admin/FeesSettings';
import RevenueStats from './src/screens/Admin/RevenueStats';
import Reconciliation from './src/screens/Admin/Reconciliation';
import RefundManagement from './src/screens/Admin/RefundManagement';
import PartnerApplicationsScreen from './src/screens/Admin/PartnerApplicationsScreen';
import NearbyStoresMap from './src/screens/NearbyStoresMap';
import TrackShipperScreen from './src/screens/TrackShipperScreen';
import BecomePartnerScreen from './src/screens/BecomePartnerScreen';
import ApplyShipperScreen from './src/screens/ApplyShipperScreen';
import ApplyOwnerScreen from './src/screens/ApplyOwnerScreen';
import MyApplicationsScreen from './src/screens/MyApplicationsScreen';
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

function MainTabs() {
  const currentRoute = useNavigationState(state => {
    if (!state) return undefined;
    const route = state.routes[state.index];
    return route.state ? route.state.routes[route.state.index]?.name : route.name;
  });

  // Hide bottom bar on detail screens and cart/checkout
  const hideBottomBar = currentRoute === 'StoreDetail' || 
                        currentRoute === 'ProductDetail' || 
                        currentRoute === 'OrderDetail' || 
                        currentRoute === 'TrackShipper' || 
                        currentRoute === 'CartTab' || 
                        currentRoute === 'Checkout' || 
                        currentRoute === 'OrderSuccess' ||
                        currentRoute === 'AddressList' || 
                        currentRoute === 'AddAddress' || 
                        currentRoute === 'Wallet' || 
                        currentRoute === 'TopUp' || 
                        currentRoute === 'Withdraw' || 
                        currentRoute === 'PaymentQR' || 
                        currentRoute === 'TransactionHistory' ||
                        currentRoute === 'Support' ||
                        currentRoute === 'TermsOfService' ||
                        currentRoute === 'PrivacyPolicy' ||
                        currentRoute === 'About' ||
                        currentRoute === 'Vouchers' ||
                        currentRoute === 'ProfileTab' ||
                        currentRoute === 'BecomePartner' ||
                        currentRoute === 'ApplyShipper' ||
                        currentRoute === 'ApplyOwner' ||
                        currentRoute === 'MyApplications';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="HomeTab" component={HomeScreen} />
        <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="OrdersTab" component={OrdersScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="TrackShipper" component={TrackShipperScreen} />
        <Stack.Screen name="CartTab" component={CartScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="AddressList" component={AddressListScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="TopUp" component={TopUpScreen} />
        <Stack.Screen name="Withdraw" component={WithdrawScreen} />
        <Stack.Screen name="PaymentQR" component={PaymentQRScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Vouchers" component={VouchersScreen} />
        <Stack.Screen 
          name="NearbyStoresMap" 
          component={NearbyStoresMap}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="NotificationsTab" component={NotificationsScreen} />
        <Stack.Screen name="ProfileTab" component={ProfileScreen} />
        <Stack.Screen name="MenuTab" component={MenuScreen} />
        <Stack.Screen name="BecomePartner" component={BecomePartnerScreen} />
        <Stack.Screen name="ApplyShipper" component={ApplyShipperScreen} />
        <Stack.Screen name="ApplyOwner" component={ApplyOwnerScreen} />
        <Stack.Screen name="MyApplications" component={MyApplicationsScreen} />
      </Stack.Navigator>
      {!hideBottomBar && <BottomTabBar />}
    </View>
  );
}

function Navigation() {
  const { loading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="ManageUsers" component={ManageUsers} />
        <Stack.Screen name="ManageOwners" component={ManageOwners} />
        <Stack.Screen name="ManageShippers" component={ManageShippers} />
        <Stack.Screen name="UserAccess" component={UserAccess} />
        <Stack.Screen name="FeesSettings" component={FeesSettings} />
        <Stack.Screen name="RevenueStats" component={RevenueStats} />
        <Stack.Screen name="Reconciliation" component={Reconciliation} />
        <Stack.Screen name="RefundManagement" component={RefundManagement} />
        <Stack.Screen name="PartnerApplications" component={PartnerApplicationsScreen} />
        <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
        <Stack.Screen name="ManageStore" component={ManageStore} />
        <Stack.Screen name="ManageProduct" component={ManageProduct} />
        <Stack.Screen name="ManageOrders" component={ManageOrders} />
        <Stack.Screen name="RevenueReport" component={RevenueReport} />
        <Stack.Screen name="ManagePromotions" component={ManagePromotions} />
        <Stack.Screen name="ShipperDashboard" component={ShipperDashboard} />
        <Stack.Screen name="WorkLocation" component={WorkLocation} />
        <Stack.Screen name="AvailableOrders" component={AvailableOrders} />
        <Stack.Screen name="MyOrders" component={MyOrders} />
        <Stack.Screen name="DeliveryHistory" component={DeliveryHistory} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
