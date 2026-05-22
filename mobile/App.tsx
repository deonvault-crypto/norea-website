import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import {
  AdminAnalytics,
  AdminCustomer,
  ProductInput,
  adminCreateProduct,
  adminCreateDiscount,
  adminDisableProduct,
  adminFetchAnalytics,
  adminFetchCustomers,
  adminFetchOrders,
  adminFetchProducts,
  adminUpdateOrderDetails,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminUploadProductImage,
  createVivaPayment,
  createOrder,
  fetchVivaPaymentStatus,
  fetchOrders,
  fetchProducts,
  register,
  requestAccountDeletion,
  savePushToken,
  signIn,
  signOut,
  verifyOrderPayment
} from "./src/api/client";
import { appConfig } from "./src/config";
import { categories, products as localProducts } from "./src/data/catalog";
import { colors, radius, shadow } from "./src/theme";
import { Address, AuthUser, CartItem, Order, OrderStatus, Payment, PaymentMethod, Product } from "./src/types";

type Screen =
  | "Splash"
  | "Onboarding"
  | "Login"
  | "Register"
  | "Home"
  | "Shop"
  | "Product"
  | "Wishlist"
  | "Cart"
  | "Checkout"
  | "OrderConfirmation"
  | "Orders"
  | "Account"
  | "Notifications"
  | "Settings"
  | "Privacy"
  | "Terms"
  | "Support"
  | "Website"
  | "AdminDashboard"
  | "AdminProductForm";

type User = AuthUser | null;
type InAppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read?: boolean;
};

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "VIVA", label: "Card payment with Viva Smart Checkout" }
];
const mainTabs: Screen[] = ["Home", "Shop", "Wishlist", "Cart", "Account"];

const privacySections = [
  {
    title: "Data and privacy handling",
    body: "Noréa collects only the information needed to run a physical-goods ecommerce service: name, email, phone number, delivery address, order details and support messages. We do not request contacts, SMS logs, call logs, background location or tracking permissions."
  },
  {
    title: "Purchases and orders",
    body: "Order data is used to process checkout, verify payment, coordinate delivery, provide support and maintain required transaction records. Card details are handled by secure payment providers and are not stored in the Noréa app."
  },
  {
    title: "Notifications",
    body: "Push notifications are optional. If enabled, Noréa may send order tracking, delivery, payment and restock updates. You can turn notifications off in your device settings at any time."
  },
  {
    title: "Account deletion",
    body: "To request account deletion or personal data access, contact Noréa support through the app or the support page. We may retain limited order records when required for fraud prevention, tax, accounting or dispute resolution."
  }
];

const termsSections = [
  {
    title: "Physical goods only",
    body: "Noréa sells activewear and athleisure products. The app does not sell coins, digital fitness plans, subscriptions, gambling products or premium digital unlocks."
  },
  {
    title: "Payments",
    body: "Checkout uses Viva Smart Checkout for online card payment on physical activewear orders. Final card payment is processed securely in PLN by Viva. Noréa does not store card details."
  },
  {
    title: "Delivery policy",
    body: "Nation-wide delivery is available in Zimbabwe. Estimated delivery time is 6-10 days after payment confirmation, subject to address accuracy, inventory and courier availability."
  },
  {
    title: "Refunds and returns",
    body: "Refunds and returns are reviewed for eligible unworn items in original packaging. Payment reversals may depend on the payment provider and bank processing timelines."
  },
  {
    title: "Support",
    body: "For sizing, checkout, delivery, refund or account questions, contact Noréa support from the Support screen or visit the support page."
  }
];

const firstProduct = localProducts[0]!;
const fallbackProductImage = firstProduct.imageUrl;
const orderStatuses: OrderStatus[] = [
  "Pending",
  "Paid",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded"
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("Splash");
  const [history, setHistory] = useState<Screen[]>([]);
  const [user, setUser] = useState<User>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product>(firstProduct);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [lastPaymentInstructions, setLastPaymentInstructions] = useState("");
  const [lastPaymentUrl, setLastPaymentUrl] = useState("");
  const [paymentOutcome, setPaymentOutcome] = useState<"pending" | "success" | "failed" | "cancelled">("pending");
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<AdminCustomer[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null);
  const [adminError, setAdminError] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setScreen("Onboarding"), 900);
    fetchProducts()
      .then((nextProducts) => {
        setCatalog(Array.isArray(nextProducts) ? nextProducts : []);
        setCatalogError("");
      })
      .catch((error) => {
        setCatalog([]);
        setCatalogError(error instanceof Error ? error.message : "Unable to load products.");
      })
      .finally(() => setCatalogLoading(false));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handlePaymentReturn = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const status = String(parsed.queryParams?.status || "").toLowerCase();
      const orderId = String(parsed.queryParams?.orderId || "");
      if (parsed.path?.includes("payment") || parsed.hostname?.includes("payment") || status) {
        setPaymentOutcome(status === "cancelled" ? "cancelled" : status === "failed" ? "failed" : "pending");
        if (orderId && lastOrder?.id === orderId) {
          fetchVivaPaymentStatus(orderId)
            .then((result) => {
              setLastOrder(result.order);
              setLastPayment(result.payment);
              setOrders((current) => [result.order, ...current.filter((order) => order.id !== result.order.id)]);
              if (result.order.paymentStatus === "Paid") setPaymentOutcome("success");
            })
            .catch(() => undefined);
        }
        go("OrderConfirmation");
      }
    };
    const subscription = Linking.addEventListener("url", handlePaymentReturn);
    Linking.getInitialURL().then((url) => {
      if (url) handlePaymentReturn({ url });
    });
    return () => subscription.remove();
  }, [lastOrder?.id]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.priceUsd * item.quantity, 0),
    [cart]
  );

  const go = (next: Screen) => {
    setHistory((current) => (mainTabs.includes(next) ? [] : [...current, screen]));
    setScreen(next);
  };

  const back = () => {
    const previous = history[history.length - 1] ?? "Home";
    setHistory((current) => current.slice(0, -1));
    setScreen(previous);
  };

  const addNotification = (title: string, body: string) => {
    setNotifications((current) => [
      {
        id: `${Date.now()}-${current.length}`,
        title,
        body,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  };

  const refreshAdminData = async (account: User = user) => {
    if (!isAdminUser(account)) {
      setAdminError("Authorized account required.");
      return;
    }
    try {
      setAdminError("");
      const [nextProducts, nextOrders, nextCustomers, nextAnalytics] = await Promise.all([
        adminFetchProducts(),
        adminFetchOrders(),
        adminFetchCustomers(),
        adminFetchAnalytics()
      ]);
      setAdminProducts(nextProducts);
      setAdminOrders(nextOrders);
      setAdminCustomers(nextCustomers);
      setAdminAnalytics(nextAnalytics);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Admin data could not be loaded.");
    }
  };

  const addToCart = (
    product: Product,
    size = product.sizes[1] ?? product.sizes[0] ?? "M",
    colour = product.colours[0] ?? "Onyx"
  ) => {
    setCart((current) => {
      const found = current.find(
        (item) => item.product.id === product.id && item.size === size && item.colour === colour
      );
      if (found) {
        return current.map((item) =>
          item === found ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1, size, colour }];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart((current) =>
      current
        .map((item, i) => (i === index ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleWishlist = (id: string) => {
    setWishlist((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const nav = (
    <View style={styles.tabs}>
      {[
        ["Home", "home-outline"],
        ["Shop", "bag-outline"],
        ["Wishlist", "heart-outline"],
        ["Cart", "cart-outline"],
        ["Account", "person-outline"]
      ].map(([label, icon]) => (
        <Pressable key={label} style={styles.tab} onPress={() => go(label as Screen)}>
          <Ionicons name={icon as never} size={22} color={screen === label ? colors.rose : colors.navy} />
          <Text style={[styles.tabText, screen === label && styles.tabActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );

  const heroProduct = catalog.find((product) => product.featured) ?? catalog[0] ?? firstProduct;

  const frame = (children: React.ReactNode, showTabs = true) => (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {showTabs && (
        <TopBar
          onGo={go}
          onBack={mainTabs.includes(screen) ? undefined : back}
          cartCount={cart.length}
        />
      )}
      {children}
      {showTabs && nav}
    </SafeAreaView>
  );

  if (screen === "Splash") {
    return (
      <SafeAreaView style={styles.splash}>
        <AnimatedLogo variant="brand" />
        <Text style={styles.splashLine}>Luxury activewear from Zimbabwe</Text>
      </SafeAreaView>
    );
  }

  if (screen === "Onboarding") {
    return (
      <SafeAreaView style={styles.safe}>
        <ImageBackground
          source={{ uri: heroProduct.imageUrl }}
          style={styles.onboardingImage}
          imageStyle={styles.onboardingImageRadius}
        >
          <View style={styles.onboardingShade} />
          <View style={styles.onboardingCopy}>
            <Text style={styles.heroText}>BE STRONG.{"\n"}BE YOU.</Text>
            <Text style={styles.heroSub}>
              Premium activewear and athleisure for women and men, delivered across Zimbabwe.
            </Text>
          </View>
        </ImageBackground>
        <View style={styles.onboardingActions}>
          <PrimaryButton label="Shop Noréa" onPress={() => go("Home")} />
          <SecondaryButton label="Sign in" onPress={() => go("Login")} />
          <LegalFooter />
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "Login" || screen === "Register") {
    return frame(
      <AuthScreen
        mode={screen}
        onBack={back}
        onSwitch={() => go(screen === "Login" ? "Register" : "Login")}
        onSubmit={async (payload) => {
          try {
            const nextUser =
              screen === "Login"
                ? await signIn(payload.email, payload.password)
                : await register(payload.name, payload.email, payload.phone, payload.password);
            setUser(nextUser);
            if (isAdminUser(nextUser)) {
              await refreshAdminData(nextUser);
              go("AdminDashboard");
              return;
            }
            go("Home");
          } catch (error) {
            Alert.alert("Sign-in failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
      />,
      false
    );
  }

  if (screen === "Home") {
    return frame(
      <ScrollView contentContainerStyle={styles.scroll}>
        <ImageBackground source={{ uri: heroProduct.imageUrl }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <Text style={styles.heroText}>BE STRONG.{"\n"}BE YOU.</Text>
          <Text style={styles.heroSub}>Luxury activewear made for movement, confidence and everyday polish.</Text>
          <PrimaryButton label="Shop new arrivals" onPress={() => go("Shop")} />
        </ImageBackground>
        <SectionTitle title="Categories" action="View all" onPress={() => go("Shop")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable key={category} style={styles.categoryChip} onPress={() => go("Shop")}>
              <Text style={styles.categoryText}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ProductCarousel
          title="New arrivals"
          products={(catalog.filter((product) => product.newArrival).length ? catalog.filter((product) => product.newArrival) : catalog).slice(0, 4)}
          wishlist={wishlist}
          onProduct={(product) => {
            setSelectedProduct(product);
            go("Product");
          }}
          onWishlist={toggleWishlist}
        />
        <ProductCarousel
          title="Best sellers"
          products={((catalog.filter((product) => product.bestSeller).length ? catalog.filter((product) => product.bestSeller) : catalog)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4))}
          wishlist={wishlist}
          onProduct={(product) => {
            setSelectedProduct(product);
            go("Product");
          }}
          onWishlist={toggleWishlist}
        />
      </ScrollView>
    );
  }

  if (screen === "Shop") {
    return frame(
      <ShopScreen
        products={catalog}
        wishlist={wishlist}
        loading={catalogLoading}
        error={catalogError}
        onProduct={(product) => {
          setSelectedProduct(product);
          go("Product");
        }}
        onWishlist={toggleWishlist}
      />
    );
  }

  if (screen === "Product") {
    return frame(
      <ProductDetail
        product={selectedProduct}
        inWishlist={wishlist.includes(selectedProduct.id)}
        onWishlist={() => toggleWishlist(selectedProduct.id)}
        onAdd={addToCart}
      />
    );
  }

  if (screen === "Wishlist") {
    const items = catalog.filter((product) => wishlist.includes(product.id));
    return frame(
      <ListScreen
        title="Wishlist"
        emptyTitle="Your wishlist is empty."
        empty="Save pieces you love and come back to them anytime."
        products={items}
        onProduct={(product) => {
          setSelectedProduct(product);
          go("Product");
        }}
      />
    );
  }

  if (screen === "Cart") {
    return frame(
      <CartScreen cart={cart} total={total} onQty={updateQty} onCheckout={() => go("Checkout")} />
    );
  }

  if (screen === "Checkout") {
    return frame(
      <CheckoutScreen
        cart={cart}
        total={total}
        onComplete={async (paymentMethod, address) => {
          if (!user) {
            Alert.alert("Sign in required", "Please sign in or register before checkout.");
            go("Login");
            return;
          }
          try {
            const result = await createOrder({
              items: cart,
              address,
              paymentMethod
            });
            setOrders((current) => [result.order, ...current]);
            setLastOrder(result.order);
            setLastPayment(result.payment);
            setLastPaymentInstructions(result.paymentInstructions);
            setLastPaymentUrl(result.redirectUrl || result.payment?.redirectUrl || "");
            setPaymentOutcome("pending");
            addNotification(
              "Order created",
              `Order ${result.order.id} is ready for secure Viva payment in PLN.`
            );
            setCart([]);
            if (result.redirectUrl) {
              Linking.openURL(result.redirectUrl);
            }
            go("OrderConfirmation");
          } catch (error) {
            Alert.alert("Checkout failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
      />
    );
  }

  if (screen === "OrderConfirmation") {
    return frame(
      <OrderConfirmationScreen
        order={lastOrder}
        paymentInstructions={lastPaymentInstructions}
        onVerify={async () => {
          if (!lastOrder) return;
          try {
            const result = await fetchVivaPaymentStatus(lastOrder.id).catch(() => verifyOrderPayment(lastOrder.id));
            setLastOrder(result.order);
            setLastPayment(result.payment);
            setOrders((current) => [result.order, ...current.filter((order) => order.id !== result.order.id)]);
            setPaymentOutcome(result.order.paymentStatus === "Paid" ? "success" : result.order.paymentStatus === "Failed" ? "failed" : result.order.paymentStatus === "Cancelled" ? "cancelled" : "pending");
            Alert.alert("Payment status", `Order status: ${result.order.status}`);
          } catch (error) {
            Alert.alert("Payment check failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
        onOpenPayment={async () => {
          if (!lastOrder) return;
          try {
            const result = lastPaymentUrl
              ? { redirectUrl: lastPaymentUrl, payment: lastPayment, order: lastOrder, paymentInstructions: lastPaymentInstructions }
              : await createVivaPayment(lastOrder.id);
            setLastPayment(result.payment || null);
            setLastPaymentUrl(result.redirectUrl || result.payment?.redirectUrl || "");
            setLastPaymentInstructions(result.paymentInstructions || result.payment?.instructions || lastPaymentInstructions);
            const url = result.redirectUrl || result.payment?.redirectUrl;
            if (url) Linking.openURL(url);
          } catch (error) {
            Alert.alert("Payment unavailable", error instanceof Error ? error.message : "Please try again.");
          }
        }}
        payment={lastPayment}
        paymentOutcome={paymentOutcome}
        onOrders={() => go("Orders")}
        onShop={() => go("Shop")}
      />
    );
  }

  if (screen === "Orders") {
    return frame(
      <OrdersScreen
        orders={orders}
        onRefresh={async () => {
          try {
            setOrders(await fetchOrders());
          } catch {
            Alert.alert("Orders", "Sign in to view your order history.");
          }
        }}
      />
    );
  }

  if (screen === "Account") {
    return frame(
      <AccountScreen
        user={user}
        onLogin={() => go("Login")}
        onOrders={() => go("Orders")}
        onSettings={() => go("Settings")}
        onPrivacy={() => Linking.openURL(appConfig.privacyUrl)}
        onTerms={() => Linking.openURL(appConfig.termsUrl)}
        onSupport={() => Linking.openURL(appConfig.supportUrl)}
        onWebsite={() => Linking.openURL(appConfig.websiteUrl)}
        onNotifications={() => go("Notifications")}
        onAdminDashboard={async () => {
          await refreshAdminData();
          go("AdminDashboard");
        }}
        onLogout={async () => {
          await signOut();
          setUser(null);
        }}
      />
    );
  }

  if (screen === "Notifications") {
    return frame(
      <NotificationsCenterScreen
        notifications={notifications}
        onEnable={async () => {
          const permissions = await Notifications.requestPermissionsAsync();
          if (!permissions.granted) {
            Alert.alert("Notifications", "Notification permission remains off. You can enable it later in device settings.");
            return;
          }
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          savePushToken(token).catch(() => undefined);
          addNotification(
            "Notifications enabled",
            "Noréa can send order tracking, delivery and restock updates when available."
          );
        }}
      />
    );
  }

  if (screen === "Settings") {
    return frame(
      <SettingsScreen
        user={user}
        onPrivacy={() => go("Privacy")}
        onTerms={() => go("Terms")}
        onSupport={() => go("Support")}
        onNotifications={() => go("Notifications")}
        onLogout={async () => {
          await signOut();
          setUser(null);
          go("Account");
        }}
        onDeleteAccount={async () => {
          if (!user) {
            Alert.alert("Sign in required", "Please sign in before requesting account deletion.");
            go("Login");
            return;
          }
          try {
            await requestAccountDeletion("Customer requested account deletion from Settings.");
            Alert.alert("Request received", "Noréa support will process your account deletion request and may contact you to confirm identity.");
          } catch (error) {
            Alert.alert("Request failed", error instanceof Error ? error.message : "Please contact support.");
          }
        }}
      />
    );
  }

  if (screen === "Privacy") {
    return frame(
      <LegalScreen
        title="Privacy policy"
        url={appConfig.privacyUrl}
        sections={privacySections}
      />
    );
  }

  if (screen === "Terms") {
    return frame(
      <LegalScreen
        title="Terms of service"
        url={appConfig.termsUrl}
        sections={termsSections}
      />
    );
  }

  if (screen === "Support") {
    return frame(
      <SupportScreen />
    );
  }

  if (screen === "Website") {
    return frame(
      <WebsiteScreen />
    );
  }

  if (screen === "AdminDashboard") {
    return frame(
      <AdminDashboardScreen
        user={user}
        products={adminProducts}
        orders={adminOrders}
        customers={adminCustomers}
        analytics={adminAnalytics}
        error={adminError}
        onRefresh={refreshAdminData}
        onCreate={() => {
          setEditingProduct(null);
          go("AdminProductForm");
        }}
        onEdit={(product) => {
          setEditingProduct(product);
          go("AdminProductForm");
        }}
        onDisable={async (product) => {
          try {
            await adminDisableProduct(product.id);
            setAdminProducts((current) => current.filter((item) => item.id !== product.id));
            setCatalog((current) => current.filter((item) => item.id !== product.id));
            Alert.alert("Product disabled", `${product.title} is no longer visible to customers.`);
          } catch (error) {
            Alert.alert("Product update failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
        onStatus={async (order, status) => {
          try {
            const updated = await adminUpdateOrderStatus(order.id, status);
            setAdminOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            addNotification("Order status updated", `Order ${updated.id} moved to ${updated.status}.`);
          } catch (error) {
            Alert.alert("Order update failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
        onOrderDetails={async (order, payload) => {
          try {
            const updated = await adminUpdateOrderDetails(order.id, payload);
            setAdminOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            Alert.alert("Order updated", `Order ${updated.id} was updated.`);
          } catch (error) {
            Alert.alert("Order update failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
        onCreateDiscount={async (code, percentOff) => {
          try {
            const discount = await adminCreateDiscount(code, percentOff);
            Alert.alert("Discount created", `${discount.code} gives ${discount.percentOff}% off.`);
          } catch (error) {
            Alert.alert("Discount failed", error instanceof Error ? error.message : "Check the code and percentage.");
          }
        }}
        onLogout={async () => {
          await signOut();
          setUser(null);
          go("Account");
        }}
        onLogin={() => go("Login")}
      />
    );
  }

  if (screen === "AdminProductForm") {
    return frame(
      <AdminProductFormScreen
        user={user}
        product={editingProduct}
        onCancel={() => go("AdminDashboard")}
        onSave={async (input, imageUrl) => {
          try {
            const saved = editingProduct
              ? await adminUpdateProduct(editingProduct.id, input)
              : await adminCreateProduct(input);
            const withImage =
              editingProduct && imageUrl && !(Array.isArray(saved.gallery) && saved.gallery.includes(imageUrl))
                ? await adminUploadProductImage(saved.id, imageUrl)
                : saved;
            setAdminProducts((current) => [
              withImage,
              ...current.filter((item) => item.id !== withImage.id)
            ]);
            setCatalog((current) => [
              withImage,
              ...current.filter((item) => item.id !== withImage.id)
            ]);
            Alert.alert("Product saved", `${withImage.title} is updated.`);
            go("AdminDashboard");
          } catch (error) {
            Alert.alert("Product save failed", error instanceof Error ? error.message : "Check the product fields and try again.");
          }
        }}
        onLogin={() => go("Login")}
      />
    );
  }

  return frame(<SupportScreen />);
}

function TopBar({
  onGo,
  onBack,
  cartCount
}: {
  onGo: (screen: Screen) => void;
  onBack?: () => void;
  cartCount: number;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topLeft}>
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={19} color={colors.navy} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <AnimatedLogo />
      </View>
      <View style={styles.topActions}>
        <IconButton icon="notifications-outline" onPress={() => onGo("Notifications")} />
        <Pressable style={styles.cartBadge} onPress={() => onGo("Cart")}>
          <Ionicons name="cart-outline" size={22} color={colors.navy} />
          {cartCount > 0 && <Text style={styles.cartBadgeText}>{cartCount}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function AnimatedLogo({ variant = "logo" }: { variant?: "logo" | "brand" }) {
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(lift, {
        toValue: -4,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [lift]);

  return (
    <Animated.Text style={[variant === "brand" ? styles.brand : styles.logo, { transform: [{ translateY: lift }] }]}>
      NORÉA
    </Animated.Text>
  );
}

function LegalFooter() {
  return (
    <View style={styles.legalFooter}>
      <Pressable onPress={() => Linking.openURL(appConfig.privacyUrl)}>
        <Text style={styles.legalFooterLink}>Privacy</Text>
      </Pressable>
      <Text style={styles.legalFooterDivider}>|</Text>
      <Pressable onPress={() => Linking.openURL(appConfig.termsUrl)}>
        <Text style={styles.legalFooterLink}>Terms</Text>
      </Pressable>
      <Text style={styles.legalFooterDivider}>|</Text>
      <Pressable onPress={() => Linking.openURL(appConfig.supportUrl)}>
        <Text style={styles.legalFooterLink}>Support</Text>
      </Pressable>
    </View>
  );
}

function AuthScreen({
  mode,
  onSwitch,
  onBack,
  onSubmit
}: {
  mode: "Login" | "Register";
  onSwitch: () => void;
  onBack: () => void;
  onSubmit: (payload: { name: string; email: string; phone: string; password: string }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.auth}>
      <Pressable style={styles.authBack} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color={colors.navy} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <AnimatedLogo />
      <Text style={styles.pageTitle}>{mode === "Login" ? "Welcome back" : "Create account"}</Text>
      <Text style={styles.body}>Secure customer accounts for orders, saved addresses and delivery updates.</Text>
      {mode === "Register" && (
        <>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </>
      )}
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <PrimaryButton label={mode === "Login" ? "Sign in" : "Register"} onPress={() => onSubmit({ name, email, phone, password })} />
      <SecondaryButton
        label={mode === "Login" ? "Create a Noréa account" : "I already have an account"}
        onPress={onSwitch}
      />
      <LegalFooter />
    </KeyboardAvoidingView>
  );
}

function ShopScreen({
  products,
  wishlist,
  loading,
  error,
  onProduct,
  onWishlist
}: {
  products: Product[];
  wishlist: string[];
  loading: boolean;
  error: string;
  onProduct: (product: Product) => void;
  onWishlist: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Best");
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products.filter(isRenderableProduct) : []),
    [products]
  );

  const filtered = useMemo(() => {
    const next = safeProducts.filter((product) => {
      const text = `${product.title} ${product.category} ${product.description || ""}`.toLowerCase();
      return (
        (category === "All" || product.category === category) &&
        text.includes(query.trim().toLowerCase())
      );
    });
    if (sort === "Price low") return [...next].sort((a, b) => a.priceUsd - b.priceUsd);
    if (sort === "Price high") return [...next].sort((a, b) => b.priceUsd - a.priceUsd);
    return [...next].sort((a, b) => b.rating - a.rating);
  }, [category, query, safeProducts, sort]);
  const showEmptyState = safeProducts.length === 0 || filtered.length === 0;

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Shop</Text>
      <TextInput
        style={styles.search}
        placeholder="Search leggings, hoodies, gym sets..."
        value={query}
        onChangeText={setQuery}
      />
      {loading && (
        <View style={styles.inlineStatus}>
          <ActivityIndicator color={colors.rose} />
          <Text style={styles.body}>Loading products...</Text>
        </View>
      )}
      {!!error && <InfoPanel title="Catalog error" body={error} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {["All", ...categories].map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.filterChip, category === item && styles.filterActive]}
          >
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {["Best", "Price low", "Price high"].map((item) => (
          <Pressable
            key={item}
            onPress={() => setSort(item)}
            style={[styles.sortChip, sort === item && styles.sortActive]}
          >
            <Text style={styles.filterText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          showEmptyState && !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="bag-handle-outline" size={34} color={colors.rose} />
              <Text style={styles.emptyTitle}>
                {safeProducts.length === 0 ? "No products available yet." : "No products to show"}
              </Text>
              <Text style={styles.body}>
                {safeProducts.length === 0
                  ? "New Noréa pieces will appear here soon."
                  : "No pieces match these filters yet. Try another category or search term."}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            liked={wishlist.includes(item.id)}
            onPress={() => onProduct(item)}
            onWishlist={() => onWishlist(item.id)}
          />
        )}
      />
    </View>
  );
}

function isRenderableProduct(product: Product | null | undefined): product is Product {
  return Boolean(
    product &&
    typeof product.id === "string" &&
    typeof product.title === "string" &&
    typeof product.category === "string" &&
    typeof product.priceUsd === "number"
  );
}

function ProductDetail({
  product,
  inWishlist,
  onWishlist,
  onAdd
}: {
  product: Product;
  inWishlist: boolean;
  onWishlist: () => void;
  onAdd: (product: Product, size?: string, colour?: string) => void;
}) {
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "M");
  const [colour, setColour] = useState(product.colours[0] ?? "Onyx");
  const [quantity, setQuantity] = useState(1);
  const gallery = product.gallery.length ? product.gallery : [product.imageUrl || fallbackProductImage];
  const canAdd = product.inventory > 0 && product.inStock !== false;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {gallery.map((image) => (
          <OptimizedImage key={image} uri={image} style={styles.detailImage} label={product.title} />
        ))}
      </ScrollView>
      <View style={styles.detailHead}>
        <View>
          <Text style={styles.badge}>{product.badge}</Text>
          <Text style={styles.pageTitle}>{product.title}</Text>
          <PriceLine product={product} />
          <Text style={styles.rating}>★ {product.rating.toFixed(1)} • {product.reviews.length || 1} review</Text>
        </View>
        <IconButton icon={inWishlist ? "heart" : "heart-outline"} onPress={onWishlist} />
      </View>
      <Text style={styles.body}>{product.description}</Text>
      <OptionRow label="Sizes" values={product.sizes} selected={size} onSelect={setSize} />
      <OptionRow label="Colours" values={product.colours} selected={colour} onSelect={setColour} />
      <View style={styles.qtyRow}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <Stepper value={quantity} onMinus={() => setQuantity(Math.max(1, quantity - 1))} onPlus={() => setQuantity(quantity + 1)} />
      </View>
      <InfoPanel title="Delivery" body={product.deliveryInfo} />
      <InfoPanel title="Returns" body={product.returnsInfo} />
      <PrimaryButton
        label={canAdd ? "Add to cart" : "Out of stock"}
        onPress={() => {
          for (let index = 0; index < quantity; index += 1) onAdd(product, size, colour);
        }}
        disabled={!canAdd}
      />
    </ScrollView>
  );
}

function CartScreen({
  cart,
  total,
  onQty,
  onCheckout
}: {
  cart: CartItem[];
  total: number;
  onQty: (index: number, delta: number) => void;
  onCheckout: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Cart</Text>
      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={34} color={colors.rose} />
          <Text style={styles.emptyTitle}>Your cart is empty.</Text>
          <Text style={styles.body}>Add your favourite Noréa pieces to begin checkout.</Text>
        </View>
      ) : (
        cart.map((item, index) => (
          <View key={`${item.product.id}-${item.size}-${item.colour}`} style={styles.cartRow}>
            <OptimizedImage uri={item.product.imageUrl} style={styles.cartImage} label={item.product.title} />
            <View style={styles.cartCopy}>
              <Text style={styles.cardTitle}>{item.product.title}</Text>
              <Text style={styles.muted}>{item.size} • {item.colour}</Text>
              <Text style={styles.price}>USD {(item.product.priceUsd * item.quantity).toFixed(2)}</Text>
            </View>
            <Stepper value={item.quantity} onMinus={() => onQty(index, -1)} onPlus={() => onQty(index, 1)} />
          </View>
        ))
      )}
      <View style={styles.totalRow}>
        <Text style={styles.sectionTitle}>Total</Text>
        <Text style={styles.price}>USD {total.toFixed(2)}</Text>
      </View>
      <PrimaryButton label="Checkout" onPress={onCheckout} disabled={!cart.length} />
    </ScrollView>
  );
}

function CheckoutScreen({
  cart,
  total,
  onComplete
}: {
  cart: CartItem[];
  total: number;
  onComplete: (method: PaymentMethod, address: Address) => Promise<void> | void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("VIVA");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+263");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!cart.length) {
      Alert.alert("Cart empty", "Add a product before checkout.");
      return;
    }
    if (cart.some((item) => !item.size || !item.colour)) {
      Alert.alert("Choose options", "Every item needs a selected size and colour.");
      return;
    }
    if (!name.trim() || phone.trim().length < 6 || !line1.trim() || !city.trim()) {
      Alert.alert("Delivery details required", "Enter your name, phone number, address and city.");
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(method, {
        id: "checkout",
        name: name.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        city: city.trim(),
        country: "Zimbabwe"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Checkout</Text>
      <Text style={styles.body}>
        Physical goods checkout uses Viva Smart Checkout. Norea does not store card numbers.
      </Text>
      <InfoPanel title="Delivery" body="Nation-wide delivery in 6-10 days after payment confirmation." />
      <InfoPanel title="Order summary" body={`${cart.length} item(s) - ${formatCurrencyEstimates(total)}`} />
      <InfoPanel title="Secure payment" body="Final card payment is processed securely in PLN by Viva." />
      <Text style={styles.sectionTitle}>Delivery address</Text>
      <Input label="Full name" value={name} onChangeText={setName} />
      <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Street address" value={line1} onChangeText={setLine1} />
      <Input label="City" value={city} onChangeText={setCity} />
      <Text style={styles.sectionTitle}>Payment method</Text>
      {paymentMethods.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.paymentRow, method === item.id && styles.paymentActive]}
          onPress={() => setMethod(item.id)}
        >
          <Ionicons name={method === item.id ? "radio-button-on" : "radio-button-off"} size={22} color={colors.rose} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.muted}>You will be redirected to Viva to complete payment in PLN.</Text>
          </View>
        </Pressable>
      ))}
      <PrimaryButton
        label={submitting ? "Creating order..." : "Place order securely"}
        onPress={submit}
        disabled={!cart.length || submitting}
      />
    </ScrollView>
  );
}

function OrderConfirmationScreen({
  order,
  payment,
  paymentOutcome,
  paymentInstructions,
  onVerify,
  onOpenPayment,
  onOrders,
  onShop
}: {
  order: Order | null;
  payment: Payment | null;
  paymentOutcome: "pending" | "success" | "failed" | "cancelled";
  paymentInstructions: string;
  onVerify: () => Promise<void> | void;
  onOpenPayment: () => Promise<void> | void;
  onOrders: () => void;
  onShop: () => void;
}) {
  const paid = order?.paymentStatus === "Paid" || paymentOutcome === "success";
  const failed = order?.paymentStatus === "Failed" || paymentOutcome === "failed";
  const cancelled = order?.paymentStatus === "Cancelled" || paymentOutcome === "cancelled";
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.successIcon, (failed || cancelled) && styles.failureIcon]}>
        <Ionicons name={paid ? "checkmark" : failed || cancelled ? "close" : "card-outline"} size={34} color={colors.white} />
      </View>
      <Text style={styles.pageTitle}>{paid ? "Payment confirmed" : failed || cancelled ? "Payment not completed" : "Complete payment"}</Text>
      {order ? (
        <>
          <Text style={styles.body}>
            {paid
              ? "Your Norea order is paid and ready for processing."
              : failed || cancelled
                ? "Your order is saved, but payment was not completed. You can try again securely."
                : "Your Norea order is saved. Complete the card payment in Viva to confirm it."}
          </Text>
          <InfoPanel title="Order number" body={order.id} />
          <InfoPanel title="Status" body={order.status} />
          <InfoPanel title="Total" body={formatCurrencyEstimates(order.totalUsd, payment?.amountPln || order.paymentAmountPln)} />
          {!!payment?.orderCode && <InfoPanel title="Viva order code" body={payment.orderCode} />}
          {!!(payment?.transactionId || order.paymentTransactionId) && (
            <InfoPanel title="Transaction ID" body={payment?.transactionId || order.paymentTransactionId || ""} />
          )}
          {!!paymentInstructions && <InfoPanel title="Payment" body={paymentInstructions} />}
        </>
      ) : (
        <Text style={styles.body}>Your order was submitted. Refresh orders to see the latest tracking.</Text>
      )}
      {order && !paid && <PrimaryButton label="Open Viva checkout" onPress={onOpenPayment} />}
      {order && <SecondaryButton label="Check payment status" onPress={onVerify} />}
      <SecondaryButton label="View orders" onPress={onOrders} />
      <SecondaryButton label="Continue shopping" onPress={onShop} />
    </ScrollView>
  );
}

function OrdersScreen({ orders, onRefresh }: { orders: Order[]; onRefresh: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.rowBetween}>
        <Text style={styles.pageTitle}>Orders</Text>
        <SecondaryButton label="Refresh" onPress={onRefresh} compact />
      </View>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={34} color={colors.rose} />
          <Text style={styles.emptyTitle}>No orders yet.</Text>
          <Text style={styles.body}>Your Noréa orders will appear here after checkout.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.cardTitle}>Order {order.id}</Text>
            <Text style={styles.price}>{formatCurrencyEstimates(order.totalUsd, order.paymentAmountPln)}</Text>
            <Text style={styles.muted}>{order.paymentProvider || order.paymentMethod} - {order.paymentStatus || "Pending payment"}</Text>
            {!!order.paymentTransactionId && <Text style={styles.muted}>Transaction {order.paymentTransactionId}</Text>}
            <OrderProgress status={order.status} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function AccountScreen({
  user,
  onLogin,
  onOrders,
  onSettings,
  onPrivacy,
  onTerms,
  onSupport,
  onWebsite,
  onNotifications,
  onAdminDashboard,
  onLogout
}: {
  user: User;
  onLogin: () => void;
  onOrders: () => void;
  onSettings: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  onSupport: () => void;
  onWebsite: () => void;
  onNotifications: () => void;
  onAdminDashboard: () => void;
  onLogout: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Account</Text>
      <Text style={styles.body}>
        {user ? `Welcome, ${user.name}.` : "Sign in for saved addresses, order history and delivery updates."}
      </Text>
      {!user && <PrimaryButton label="Sign in or register" onPress={onLogin} />}
      <MenuRow label="Orders and tracking" icon="cube-outline" onPress={onOrders} />
      <MenuRow label="Notifications" icon="notifications-outline" onPress={onNotifications} />
      <MenuRow label="Settings" icon="settings-outline" onPress={onSettings} />
      <MenuRow label="Privacy policy" icon="lock-closed-outline" onPress={onPrivacy} />
      <MenuRow label="Terms of service" icon="document-text-outline" onPress={onTerms} />
      <MenuRow label="Support" icon="help-circle-outline" onPress={onSupport} />
      <MenuRow label="Website" icon="globe-outline" onPress={onWebsite} />
      {isAdminUser(user) && <MenuRow label="Admin dashboard" icon="shield-checkmark-outline" onPress={onAdminDashboard} />}
      {user && <SecondaryButton label="Sign out" onPress={onLogout} />}
    </ScrollView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function AdminDashboardScreen({
  user,
  products,
  orders,
  customers,
  analytics,
  error,
  onRefresh,
  onCreate,
  onEdit,
  onDisable,
  onStatus,
  onOrderDetails,
  onCreateDiscount,
  onLogout,
  onLogin
}: {
  user: User;
  products: Product[];
  orders: Order[];
  customers: AdminCustomer[];
  analytics: AdminAnalytics | null;
  error: string;
  onRefresh: () => Promise<void> | void;
  onCreate: () => void;
  onEdit: (product: Product) => void;
  onDisable: (product: Product) => Promise<void> | void;
  onStatus: (order: Order, status: OrderStatus) => Promise<void> | void;
  onOrderDetails: (order: Order, payload: { trackingNumber?: string; deliveryNote?: string; status?: OrderStatus }) => Promise<void> | void;
  onCreateDiscount: (code: string, percentOff: number) => Promise<void> | void;
  onLogout: () => Promise<void> | void;
  onLogin: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"Overview" | "Products" | "Orders" | "Customers">("Overview");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");

  const refresh = async () => {
    setLoading(true);
    try {
      await onRefresh();
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminUser(user)) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Restricted access</Text>
        <Text style={styles.body}>Sign in with an authorized Noréa account to continue.</Text>
        <PrimaryButton label="Sign in" onPress={onLogin} />
      </ScrollView>
    );
  }

  const paidStatuses: OrderStatus[] = ["Paid", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const revenue = orders
    .filter((order) => paidStatuses.includes(order.status))
    .reduce((sum, order) => sum + order.totalUsd, 0);
  const lowStock = products.filter((product) => product.inventory <= 5);
  const pendingOrders = orders.filter((order) => ["Pending", "Paid", "Processing"].includes(order.status)).length;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.rowBetween}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <SecondaryButton label={loading ? "Loading" : "Refresh"} onPress={refresh} compact />
      </View>
      {!!error && <InfoPanel title="Admin API error" body={error} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["Overview", "Products", "Orders", "Customers"] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setView(item)}
            style={[styles.filterChip, view === item && styles.filterActive]}
          >
            <Text style={[styles.filterText, view === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {view === "Overview" && (
        <>
          <View style={styles.metricGrid}>
            <MetricCard label="Revenue" value={`USD ${revenue.toFixed(2)}`} />
            <MetricCard label="Orders" value={String(analytics?.orders ?? orders.length)} />
            <MetricCard label="Products" value={String(analytics?.products ?? products.length)} />
            <MetricCard label="Customers" value={String(analytics?.customers ?? customers.length)} />
          </View>
          <InfoPanel title="Open work" body={`${pendingOrders} order(s) need payment, packing or delivery action.`} />
          <Text style={styles.sectionTitle}>Low stock</Text>
          {lowStock.length === 0 ? (
            <Text style={styles.body}>No low-stock products right now.</Text>
          ) : (
            lowStock.map((product) => (
              <Pressable key={product.id} style={styles.adminCard} onPress={() => onEdit(product)}>
                <Text style={styles.cardTitle}>{product.title}</Text>
                <Text style={styles.muted}>Stock {product.inventory} • {product.category}</Text>
              </Pressable>
            ))
          )}
          <View style={styles.settingsGroup}>
            <Text style={styles.sectionTitle}>Discounts</Text>
            <Input label="Coupon code" value={discountCode} onChangeText={setDiscountCode} />
            <Input label="Percent off" value={discountPercent} onChangeText={setDiscountPercent} keyboardType="numeric" />
            <SecondaryButton
              label="Create discount"
              onPress={() => onCreateDiscount(discountCode.trim().toUpperCase(), Number(discountPercent))}
              compact
            />
          </View>
          <PrimaryButton label="Create product" onPress={onCreate} />
          <SecondaryButton label="Logout securely" onPress={onLogout} />
        </>
      )}

      {view === "Products" && (
        <>
          <PrimaryButton label="Create product" onPress={onCreate} />
          {products.length === 0 ? (
            <Text style={styles.body}>No products available yet.</Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.adminCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.cartCopy}>
                    <Text style={styles.cardTitle}>{product.title}</Text>
                    <Text style={styles.muted}>USD {(product.salePriceUsd || product.priceUsd).toFixed(2)} • Stock {product.inventory}</Text>
                    <Text style={styles.muted}>{product.sizes.join(", ")} • {product.colours.join(", ")}</Text>
                    <Text style={styles.muted}>
                      {[product.featured && "Featured", product.newArrival && "New arrival", product.bestSeller && "Best seller", product.inStock === false && "Out of stock"].filter(Boolean).join(" • ") || "Standard listing"}
                    </Text>
                  </View>
                  <OptimizedImage uri={product.imageUrl} style={styles.adminThumb} label={product.title} />
                </View>
                <View style={styles.adminActions}>
                  <SecondaryButton label="Edit" onPress={() => onEdit(product)} compact />
                  <DangerButton label="Disable" onPress={() => onDisable(product)} />
                </View>
              </View>
            ))
          )}
        </>
      )}

      {view === "Orders" && (
        <>
          {orders.length === 0 ? (
            <Text style={styles.body}>No customer orders yet.</Text>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.adminCard}>
                <Text style={styles.cardTitle}>Order {order.id}</Text>
                <Text style={styles.muted}>{formatCurrencyEstimates(order.totalUsd, order.paymentAmountPln)} - {order.paymentProvider || order.paymentMethod} - {order.paymentStatus || "Pending payment"}</Text>
                {!!order.paymentTransactionId && <Text style={styles.muted}>Transaction ID: {order.paymentTransactionId}</Text>}
                {!!order.paymentOrderCode && <Text style={styles.muted}>Viva order code: {order.paymentOrderCode}</Text>}
                <Text style={styles.muted}>{order.customer?.name || "Customer"} • {order.address?.city || "Delivery city pending"}</Text>
                <Text style={styles.muted}>Items: {(order.items || []).map((item) => `${item.quantity}× ${item.product?.title || (item as unknown as { title?: string }).title || "Item"}`).join(", ")}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
                  {orderStatuses.map((status) => (
                    <Pressable
                      key={status}
                      style={[styles.statusChip, order.status === status && styles.statusChipActive]}
                      onPress={() => onStatus(order, status)}
                    >
                      <Text style={[styles.filterText, order.status === status && styles.filterTextActive]}>{status}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Input
                  label="Tracking number"
                  value={trackingDrafts[order.id] ?? order.trackingNumber ?? ""}
                  onChangeText={(value) => setTrackingDrafts((current) => ({ ...current, [order.id]: value }))}
                />
                <Input
                  label="Delivery note"
                  value={noteDrafts[order.id] ?? order.deliveryNote ?? ""}
                  onChangeText={(value) => setNoteDrafts((current) => ({ ...current, [order.id]: value }))}
                />
                <SecondaryButton
                  label="Save delivery details"
                  onPress={() => onOrderDetails(order, {
                    trackingNumber: trackingDrafts[order.id] ?? order.trackingNumber,
                    deliveryNote: noteDrafts[order.id] ?? order.deliveryNote
                  })}
                  compact
                />
              </View>
            ))
          )}
        </>
      )}

      {view === "Customers" && (
        <>
          {customers.length === 0 ? (
            <Text style={styles.body}>No customer records yet.</Text>
          ) : (
            customers.map((customer) => (
              <View key={customer.id || customer.email} style={styles.adminCard}>
                <Text style={styles.cardTitle}>{customer.name || "Customer"}</Text>
                <Text style={styles.muted}>{customer.email}</Text>
                {!!customer.phone && <Text style={styles.muted}>{customer.phone}</Text>}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function AdminProductFormScreen({
  user,
  product,
  onSave,
  onCancel,
  onLogin
}: {
  user: User;
  product: Product | null;
  onSave: (input: ProductInput, imageUrl: string) => Promise<void> | void;
  onCancel: () => void;
  onLogin: () => void;
}) {
  const [title, setTitle] = useState(product?.title || "");
  const [category, setCategory] = useState(product?.category || "Activewear");
  const [price, setPrice] = useState(product ? String(product.priceUsd) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPriceUsd ? String(product.compareAtPriceUsd) : "");
  const [salePrice, setSalePrice] = useState(product?.salePriceUsd ? String(product.salePriceUsd) : "");
  const [inventory, setInventory] = useState(product ? String(product.inventory) : "0");
  const [sizes, setSizes] = useState(product?.sizes.join(", ") || "all sizes");
  const [colours, setColours] = useState(product?.colours.join(", ") || "all colors");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || "");
  const [description, setDescription] = useState(product?.description || "");
  const [featured, setFeatured] = useState(Boolean(product?.featured));
  const [newArrival, setNewArrival] = useState(Boolean(product?.newArrival));
  const [bestSeller, setBestSeller] = useState(Boolean(product?.bestSeller));
  const [inStock, setInStock] = useState(product?.inStock ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const priceUsd = Number(price);
    const compareAtPriceUsd = compareAtPrice ? Number(compareAtPrice) : undefined;
    const salePriceUsd = salePrice ? Number(salePrice) : undefined;
    const inventoryCount = Number.parseInt(inventory, 10);
    const nextSizes = commaValues(sizes);
    const nextColours = commaValues(colours);
    const image = imageUrl.trim() || fallbackProductImage;
    const nextId = product?.id || makeProductId(title);
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) nextErrors.title = "Product title is required.";
    if (!category.trim()) nextErrors.category = "Choose a category.";
    if (!description.trim()) nextErrors.description = "Add a customer-ready product description.";
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) nextErrors.price = "Enter a valid USD price.";
    if (compareAtPriceUsd && compareAtPriceUsd <= priceUsd) nextErrors.compareAt = "Compare-at price should be higher than the selling price.";
    if (salePriceUsd && salePriceUsd <= 0) nextErrors.sale = "Sale price must be greater than zero.";
    if (!Number.isInteger(inventoryCount) || inventoryCount < 0) nextErrors.inventory = "Enter a whole-number stock quantity.";
    if (!nextSizes.length) nextErrors.sizes = "Add at least one size.";
    if (!nextColours.length) nextErrors.colours = "Add at least one color.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const gallery = [image, ...(product?.gallery || [])].filter((value, index, list) => value && list.indexOf(value) === index);
    const payload: ProductInput = {
      id: nextId,
      title: title.trim(),
      category: category.trim(),
      priceUsd,
      compareAtPriceUsd,
      salePriceUsd,
      sizes: nextSizes,
      colours: nextColours,
      variants: nextSizes.flatMap((size) =>
        nextColours.map((colour) => ({ size, colour, inventory: inventoryCount }))
      ),
      rating: product?.rating || 0,
      badge: bestSeller ? "Best seller" : newArrival ? "New arrival" : featured ? "Featured" : product?.badge || "Noréa",
      imageUrl: image,
      gallery,
      description: description.trim(),
      deliveryInfo: product?.deliveryInfo || "Nation-wide delivery in Zimbabwe within 6-10 days.",
      returnsInfo: product?.returnsInfo || "Returns accepted within 7 days if unworn and in original packaging.",
      inventory: inventoryCount,
      inStock: inStock && inventoryCount > 0,
      featured,
      newArrival,
      bestSeller,
      active: true
    };

    setSaving(true);
    try {
      await onSave(payload, image);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdminUser(user)) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Restricted access</Text>
        <Text style={styles.body}>Sign in with an authorized Noréa account to continue.</Text>
        <PrimaryButton label="Sign in" onPress={onLogin} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>{product ? "Edit product" : "Create product"}</Text>
      <Input label="Product title" value={title} onChangeText={setTitle} />
      <FieldError message={errors.title} />
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {categories.map((item) => (
          <Pressable
            key={item}
            style={[styles.filterChip, category === item && styles.filterActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.filterText, category === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FieldError message={errors.category} />
      <Input label="USD price" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <FieldError message={errors.price} />
      <Input label="Compare-at price (optional)" value={compareAtPrice} onChangeText={setCompareAtPrice} keyboardType="numeric" />
      <FieldError message={errors.compareAt} />
      <Input label="Sale price (optional)" value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />
      <FieldError message={errors.sale} />
      <Input label="Stock quantity" value={inventory} onChangeText={setInventory} keyboardType="numeric" />
      <FieldError message={errors.inventory} />
      <ToggleRow label="In stock" value={inStock} onValueChange={setInStock} />
      <Input label="Sizes (comma-separated)" value={sizes} onChangeText={setSizes} />
      <Text style={styles.helperText}>Example: XS, S, M, L, XL</Text>
      <FieldError message={errors.sizes} />
      <Input label="Colors (comma-separated)" value={colours} onChangeText={setColours} />
      <Text style={styles.helperText}>Example: Blush, Onyx, Navy</Text>
      <FieldError message={errors.colours} />
      <ToggleRow label="Featured on home" value={featured} onValueChange={setFeatured} />
      <ToggleRow label="New arrival" value={newArrival} onValueChange={setNewArrival} />
      <ToggleRow label="Best seller" value={bestSeller} onValueChange={setBestSeller} />
      <Input label="Product image URL" value={imageUrl} onChangeText={setImageUrl} />
      <OptimizedImage uri={imageUrl || fallbackProductImage} style={styles.productPreview} label={title || "Product preview"} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline />
      <FieldError message={errors.description} />
      <View style={styles.adminActions}>
        <SecondaryButton label="Cancel" onPress={onCancel} compact />
        <PrimaryButton label={saving ? "Saving..." : "Save product"} onPress={submit} disabled={saving} />
      </View>
    </ScrollView>
  );
}

function NotificationsCenterScreen({
  notifications,
  onEnable
}: {
  notifications: InAppNotification[];
  onEnable: () => Promise<void> | void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.rowBetween}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <IconButton icon="notifications-outline" onPress={onEnable} />
      </View>
      <Text style={styles.body}>
        Order updates, payment reminders, delivery notices and restock alerts appear here.
      </Text>
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={34} color={colors.rose} />
          <Text style={styles.emptyTitle}>No notifications yet.</Text>
          <Text style={styles.body}>
            Enable notifications to receive order and delivery updates when they are available.
          </Text>
          <SecondaryButton label="Enable notifications" onPress={onEnable} compact />
        </View>
      ) : (
        notifications.map((item) => (
          <View key={item.id} style={styles.notificationCard}>
            <View style={styles.notificationIcon}>
              <Ionicons name="sparkles-outline" size={18} color={colors.rose} />
            </View>
            <View style={styles.cartCopy}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.muted}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function SettingsScreen({
  user,
  onPrivacy,
  onTerms,
  onSupport,
  onNotifications,
  onLogout,
  onDeleteAccount
}: {
  user: User;
  onPrivacy: () => void;
  onTerms: () => void;
  onSupport: () => void;
  onNotifications: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [restocks, setRestocks] = useState(false);
  const [offers, setOffers] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Settings</Text>
      <View style={styles.settingsGroup}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.body}>
          {user ? `${user.name} • ${user.email}` : "Sign in to manage profile details, saved addresses and orders."}
        </Text>
        <MenuRow label="Delivery addresses" icon="location-outline" onPress={onSupport} />
        <MenuRow label="Change password or reset access" icon="key-outline" onPress={onSupport} />
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <ToggleRow label="Order and delivery updates" value={orderUpdates} onValueChange={setOrderUpdates} />
        <ToggleRow label="Restock alerts" value={restocks} onValueChange={setRestocks} />
        <ToggleRow label="Offers and drops" value={offers} onValueChange={setOffers} />
        <SecondaryButton label="Manage device permission" onPress={onNotifications} compact />
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.sectionTitle}>Shopping</Text>
        <InfoPanel title="Currency" body="Prices are shown with USD/EUR/GBP/PLN/ZWL estimates. Final card payment is processed securely in PLN by Viva." />
        <InfoPanel title="Order preference" body="Online payment is required before delivery is released." />
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.sectionTitle}>Privacy and support</Text>
        <MenuRow label="Privacy policy" icon="lock-closed-outline" onPress={onPrivacy} />
        <MenuRow label="Terms of service" icon="document-text-outline" onPress={onTerms} />
        <MenuRow label="Support" icon="help-circle-outline" onPress={onSupport} />
        <DangerButton label="Request account deletion" onPress={onDeleteAccount} />
      </View>

      {user && <SecondaryButton label="Logout securely" onPress={onLogout} />}
    </ScrollView>
  );
}

function LegalScreen({
  title,
  url,
  sections
}: {
  title: string;
  url: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.body}>
        This in-app summary is provided for App Store review and customer clarity. The official web version is available at {url}.
      </Text>
      {sections.map((section) => (
        <View key={section.title} style={styles.legalSection}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
      <SecondaryButton label="Open online version" onPress={() => Linking.openURL(url)} />
    </ScrollView>
  );
}

function SupportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Support</Text>
      <Text style={styles.body}>
        Noréa support helps with orders, sizing, delivery, payments, refunds and account requests.
      </Text>
      <InfoPanel title="Contact support" body="Use the online support page for formal support requests, refund questions and account deletion requests." />
      <InfoPanel title="Delivery" body="Nation-wide delivery in Zimbabwe is estimated at 6-10 days after payment confirmation." />
      <InfoPanel title="Refunds" body="Refund and return requests are reviewed for unworn items in original packaging, subject to payment provider timelines." />
      <InfoPanel title="Account deletion" body="Request account deletion or privacy help through support. Noréa will confirm identity before processing account-related requests." />
      <PrimaryButton label="Open support page" onPress={() => Linking.openURL(appConfig.supportUrl)} />
      <SecondaryButton label="WhatsApp support" onPress={() => Linking.openURL(appConfig.whatsappUrl)} />
    </ScrollView>
  );
}

function WebsiteScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Website</Text>
      <Text style={styles.body}>
        Visit Noréa online for brand information, public policies and web shopping when available.
      </Text>
      <InfoPanel title="Official website" body={appConfig.websiteUrl} />
      <PrimaryButton label="Open norea.fit" onPress={() => Linking.openURL(appConfig.websiteUrl)} />
    </ScrollView>
  );
}

function ListScreen({
  title,
  emptyTitle,
  empty,
  products,
  onProduct
}: {
  title: string;
  emptyTitle: string;
  empty: string;
  products: Product[];
  onProduct: (product: Product) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>{title}</Text>
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={34} color={colors.rose} />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.body}>{empty}</Text>
        </View>
      ) : (
        products.map((product) => (
          <Pressable key={product.id} style={styles.listProduct} onPress={() => onProduct(product)}>
            <OptimizedImage uri={product.imageUrl} style={styles.cartImage} label={product.title} />
            <View style={styles.cartCopy}>
              <Text style={styles.cardTitle}>{product.title}</Text>
              <Text style={styles.price}>USD {product.priceUsd.toFixed(2)}</Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

function ProductCarousel({
  title,
  products,
  wishlist,
  onProduct,
  onWishlist
}: {
  title: string;
  products: Product[];
  wishlist: string[];
  onProduct: (product: Product) => void;
  onWishlist: (id: string) => void;
}) {
  return (
    <View>
      <SectionTitle title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            liked={wishlist.includes(product.id)}
            onPress={() => onProduct(product)}
            onWishlist={() => onWishlist(product.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ProductCard({
  product,
  liked,
  onPress,
  onWishlist
}: {
  product: Product;
  liked: boolean;
  onPress: () => void;
  onWishlist: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <OptimizedImage uri={product.imageUrl} style={styles.cardImage} label={product.title} />
      <Pressable style={styles.heart} onPress={onWishlist}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={colors.rose} />
      </Pressable>
      <Text style={styles.badge}>{product.badge}</Text>
      <Text style={styles.cardTitle}>{product.title}</Text>
      <Text style={styles.muted}>{product.category} • ★ {product.rating.toFixed(1)}</Text>
      <PriceLine product={product} compact />
    </Pressable>
  );
}

function PriceLine({ product, compact = false }: { product: Product; compact?: boolean }) {
  const price = product.salePriceUsd || product.priceUsd;
  return (
    <View style={styles.priceLine}>
      <Text style={styles.price}>USD {price.toFixed(2)}</Text>
      {!!product.compareAtPriceUsd && product.compareAtPriceUsd > price && (
        <Text style={[styles.comparePrice, compact && styles.comparePriceCompact]}>
          USD {product.compareAtPriceUsd.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

function OptimizedImage({
  uri,
  style,
  label
}: {
  uri: string;
  style: object;
  label: string;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  return (
    <View style={[style, styles.optimizedImageFrame]}>
      <Image
        source={{ uri: failed ? fallbackProductImage : uri }}
        style={styles.optimizedImage}
        resizeMode="cover"
        accessibilityLabel={label}
        progressiveRenderingEnabled
        fadeDuration={180}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setFailed(true);
          setLoading(false);
        }}
      />
      {loading && (
        <View style={styles.imageLoading}>
          <ActivityIndicator color={colors.rose} />
        </View>
      )}
    </View>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onPress}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function OptionRow({
  label,
  values,
  selected,
  onSelect
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {values.map((value) => (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[styles.filterChip, selected === value && styles.filterActive]}
          >
            <Text style={[styles.filterText, selected === value && styles.filterTextActive]}>{value}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function OrderProgress({ status }: { status: Order["status"] }) {
  const active = orderStatuses.indexOf(status);
  return (
    <View style={styles.progress}>
      {orderStatuses.map((item, index) => (
        <View key={item} style={styles.progressItem}>
          <View style={[styles.progressDot, index <= active && styles.progressDotActive]} />
          <Text style={styles.progressText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="remove" onPress={onMinus} />
      <Text style={styles.cardTitle}>{value}</Text>
      <IconButton icon="add" onPress={onPlus} />
    </View>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  const { label, ...inputProps } = props;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMultiline]}
        autoCapitalize="none"
        textAlignVertical={props.multiline ? "top" : "center"}
        {...inputProps}
      />
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <Text style={styles.fieldError}>{message}</Text> : null;
}

function MenuRow({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Ionicons name={icon as never} size={22} color={colors.rose} />
      <Text style={styles.cardTitle}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.cardTitle}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.lightPink }}
        thumbColor={value ? colors.rose : colors.white}
      />
    </View>
  );
}

function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.dangerButton} onPress={onPress}>
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

function isAdminUser(user: User) {
  return (
    String(user?.role || "").toLowerCase() === "admin" ||
    String(user?.email || "").toLowerCase() === "admin@norea.fit"
  );
}

function commaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeProductId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `norea-${slug || Date.now()}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatCurrencyEstimates(totalUsd: number, finalPln?: number) {
  const estimates = {
    usd: totalUsd,
    eur: totalUsd * 0.92,
    gbp: totalUsd * 0.78,
    pln: finalPln ?? totalUsd * 4,
    zwl: totalUsd * 322
  };
  return `USD ${estimates.usd.toFixed(2)} / EUR ${estimates.eur.toFixed(2)} / GBP ${estimates.gbp.toFixed(2)} / PLN ${estimates.pln.toFixed(2)} / ZWL ${estimates.zwl.toFixed(0)} est.`;
}

function IconButton({ icon, onPress }: { icon: string; onPress: () => void }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Ionicons name={icon as never} size={20} color={colors.navy} />
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.primary, disabled && styles.disabled]} onPress={disabled ? undefined : onPress}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  compact = false
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable style={[styles.secondary, compact && styles.compact]} onPress={onPress}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  splash: { flex: 1, backgroundColor: colors.blush, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.navy, fontSize: 42, letterSpacing: 8, fontWeight: "300" },
  logo: { color: colors.navy, fontSize: 24, letterSpacing: 5, fontWeight: "500" },
  splashLine: { color: colors.navy, marginTop: 12, letterSpacing: 1 },
  topBar: { paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 8, paddingRight: 4 },
  backText: { color: colors.navy, fontWeight: "800", fontSize: 13 },
  topActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  scroll: { padding: 18, paddingBottom: 120 },
  screen: { flex: 1, paddingHorizontal: 18 },
  onboardingImage: { flex: 1, margin: 18, overflow: "hidden", justifyContent: "flex-end" },
  onboardingImageRadius: { borderRadius: radius.lg },
  onboardingShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(11,29,58,0.32)", borderRadius: radius.lg },
  onboardingCopy: { padding: 24 },
  onboardingActions: { padding: 18, gap: 10 },
  legalFooter: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 8 },
  legalFooterLink: { color: colors.rose, fontWeight: "800", fontSize: 12 },
  legalFooterDivider: { color: colors.muted, fontSize: 12 },
  hero: { minHeight: 430, overflow: "hidden", justifyContent: "flex-end", padding: 22, marginBottom: 24 },
  heroImage: { borderRadius: radius.lg },
  heroOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(11,29,58,0.25)", borderRadius: radius.lg },
  heroText: { color: colors.white, fontSize: 48, lineHeight: 50, fontWeight: "800", letterSpacing: 0 },
  heroSub: { color: colors.white, fontSize: 16, lineHeight: 24, marginVertical: 16 },
  pageTitle: { color: colors.navy, fontSize: 34, lineHeight: 40, fontWeight: "800", marginBottom: 10, letterSpacing: 0 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 12 },
  sectionTitle: { color: colors.navy, fontSize: 20, fontWeight: "800", letterSpacing: 0 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  muted: { color: colors.muted, fontSize: 13 },
  link: { color: colors.rose, fontWeight: "700" },
  categoryChip: { backgroundColor: colors.blush, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12, marginRight: 10 },
  categoryText: { color: colors.navy, fontWeight: "700" },
  card: { width: 180, marginRight: 14, marginBottom: 16, backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, padding: 10, ...shadow },
  cardImage: { width: "100%", aspectRatio: 0.82, borderRadius: radius.sm, backgroundColor: colors.gray },
  optimizedImageFrame: { overflow: "hidden", backgroundColor: colors.gray },
  optimizedImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" },
  imageLoading: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: colors.gray },
  heart: { position: "absolute", right: 16, top: 16, backgroundColor: colors.white, borderRadius: radius.pill, padding: 7 },
  badge: { color: colors.rose, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginTop: 10, marginBottom: 4, fontWeight: "800" },
  cardTitle: { color: colors.navy, fontSize: 15, fontWeight: "800", letterSpacing: 0 },
  priceLine: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  price: { color: colors.navy, fontSize: 16, fontWeight: "900", marginTop: 4 },
  comparePrice: { color: colors.muted, fontSize: 14, textDecorationLine: "line-through" },
  comparePriceCompact: { fontSize: 12 },
  rating: { color: colors.rose, marginTop: 4, fontWeight: "700" },
  search: { backgroundColor: colors.gray, borderRadius: radius.pill, padding: 14, color: colors.navy, marginBottom: 12 },
  inlineStatus: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 28, marginTop: 18, borderRadius: radius.sm, backgroundColor: colors.gray },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: "800", marginTop: 10, marginBottom: 6 },
  filterRow: { marginBottom: 10, maxHeight: 48 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginRight: 8, backgroundColor: colors.white },
  sortChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginRight: 8, backgroundColor: colors.gray },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  sortActive: { backgroundColor: colors.blush },
  filterText: { color: colors.navy, fontWeight: "700" },
  filterTextActive: { color: colors.white },
  columns: { gap: 12 },
  grid: { paddingBottom: 120 },
  detailImage: { width: 360, height: 440, borderRadius: radius.sm, marginRight: 12, backgroundColor: colors.gray },
  detailHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 14 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoPanel: { backgroundColor: colors.gray, borderRadius: radius.sm, padding: 14, marginVertical: 8 },
  cartRow: { flexDirection: "row", gap: 12, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 14, alignItems: "center" },
  cartImage: { width: 78, height: 94, borderRadius: radius.sm, backgroundColor: colors.gray },
  cartCopy: { flex: 1 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20 },
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, marginBottom: 8 },
  paymentActive: { backgroundColor: colors.blush, borderColor: colors.rose },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  failureIcon: { backgroundColor: colors.navy },
  orderCard: { padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, marginBottom: 12, backgroundColor: colors.white },
  progress: { marginTop: 12, gap: 8 },
  progressItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  progressDotActive: { backgroundColor: colors.rose },
  progressText: { color: colors.muted, fontSize: 12 },
  auth: { flex: 1, padding: 22, justifyContent: "center", backgroundColor: colors.white },
  authBack: { position: "absolute", top: 54, left: 18, flexDirection: "row", alignItems: "center", gap: 2 },
  inputGroup: { marginBottom: 12 },
  label: { color: colors.navy, fontWeight: "800", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 14, color: colors.navy, backgroundColor: colors.white },
  inputMultiline: { minHeight: 110 },
  helperText: { color: colors.muted, fontSize: 12, marginTop: -6, marginBottom: 10 },
  fieldError: { color: colors.rose, fontSize: 12, fontWeight: "700", marginTop: -6, marginBottom: 10 },
  settingsGroup: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 14, backgroundColor: colors.white, marginBottom: 12 },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.line },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 10 },
  metricCard: { width: "47%", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 14, backgroundColor: colors.white },
  metricValue: { color: colors.navy, fontSize: 20, fontWeight: "900", marginBottom: 4 },
  adminCard: { padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, marginVertical: 8, backgroundColor: colors.white },
  adminActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" },
  adminThumb: { width: 74, height: 88, borderRadius: radius.sm, backgroundColor: colors.gray },
  dangerButton: { borderWidth: 1, borderColor: colors.rose, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  dangerText: { color: colors.rose, fontWeight: "900" },
  statusRow: { marginTop: 10 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginRight: 8, backgroundColor: colors.white },
  statusChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  notificationCard: { flexDirection: "row", gap: 12, padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.white, marginBottom: 10 },
  notificationIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blush, alignItems: "center", justifyContent: "center" },
  legalSection: { paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line },
  productPreview: { width: "100%", height: 220, borderRadius: radius.sm, backgroundColor: colors.gray, marginBottom: 12 },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.line },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray, alignItems: "center", justifyContent: "center" },
  cartBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.blush, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { position: "absolute", right: -2, top: -2, backgroundColor: colors.rose, color: colors.white, minWidth: 18, height: 18, borderRadius: 9, overflow: "hidden", textAlign: "center", fontSize: 11, fontWeight: "800" },
  primary: { backgroundColor: colors.navy, borderRadius: radius.pill, padding: 15, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryText: { color: colors.white, fontWeight: "900", letterSpacing: 0.5 },
  secondary: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.pill, padding: 15, alignItems: "center", justifyContent: "center", marginTop: 8, backgroundColor: colors.white },
  secondaryText: { color: colors.navy, fontWeight: "900" },
  compact: { paddingVertical: 10, paddingHorizontal: 14, marginTop: 0 },
  disabled: { opacity: 0.4 },
  listProduct: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line },
  tabs: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-around", paddingTop: 10, paddingBottom: Platform.OS === "ios" ? 28 : 14, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line },
  tab: { alignItems: "center", gap: 2 },
  tabText: { color: colors.navy, fontSize: 11, fontWeight: "700" },
  tabActive: { color: colors.rose }
});
