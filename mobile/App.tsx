import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { createOrder, fetchOrders, fetchProducts, register, savePushToken, signIn, signOut } from "./src/api/client";
import { appConfig } from "./src/config";
import { categories, products as localProducts } from "./src/data/catalog";
import { colors, radius, shadow } from "./src/theme";
import { Address, CartItem, Order, PaymentMethod, Product } from "./src/types";

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
  | "Orders"
  | "Account"
  | "Notifications"
  | "Settings"
  | "Support";

type User = { name: string; email: string } | null;

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "PAYNOW", label: "Paynow Zimbabwe" },
  { id: "ECOCASH", label: "EcoCash" },
  { id: "ONEMONEY", label: "OneMoney" },
  { id: "ZIPIT", label: "ZIPIT" },
  { id: "VISA", label: "Visa" },
  { id: "MASTERCARD", label: "Mastercard" },
  { id: "BANK_TRANSFER", label: "Zimbabwe bank transfer" }
];

const defaultAddress: Address = {
  id: "primary",
  name: "Noréa Customer",
  phone: "+263",
  line1: "Delivery address",
  city: "Harare",
  country: "Zimbabwe"
};

const firstProduct = localProducts[0]!;

export default function App() {
  const [screen, setScreen] = useState<Screen>("Splash");
  const [user, setUser] = useState<User>(null);
  const [catalog, setCatalog] = useState<Product[]>(localProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product>(firstProduct);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("Welcome to Noréa.");

  useEffect(() => {
    const timer = setTimeout(() => setScreen("Onboarding"), 900);
    fetchProducts().then(setCatalog).catch(() => undefined);
    return () => clearTimeout(timer);
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.priceUsd * item.quantity, 0),
    [cart]
  );

  const go = (next: Screen) => setScreen(next);

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
    setNotice(`${product.title} added to cart.`);
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

  const frame = (children: React.ReactNode, showTabs = true) => (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {showTabs && <TopBar onGo={go} cartCount={cart.length} />}
      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.navy} />
        <Text style={styles.noticeText}>{notice}</Text>
      </View>
      {children}
      {showTabs && nav}
    </SafeAreaView>
  );

  if (screen === "Splash") {
    return (
      <SafeAreaView style={styles.splash}>
        <Text style={styles.brand}>NORÉA</Text>
        <Text style={styles.splashLine}>Luxury activewear from Zimbabwe</Text>
      </SafeAreaView>
    );
  }

  if (screen === "Onboarding") {
    return (
      <SafeAreaView style={styles.safe}>
        <ImageBackground
          source={{ uri: catalog[0]?.imageUrl }}
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
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "Login" || screen === "Register") {
    return frame(
      <AuthScreen
        mode={screen}
        onSwitch={() => go(screen === "Login" ? "Register" : "Login")}
        onSubmit={async (payload) => {
          try {
            const nextUser =
              screen === "Login"
                ? await signIn(payload.email, payload.password)
                : await register(payload.name, payload.email, payload.phone, payload.password);
            setUser(nextUser);
            setNotice(`Signed in as ${nextUser.name}.`);
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
        <ImageBackground source={{ uri: catalog[0]?.imageUrl }} style={styles.hero} imageStyle={styles.heroImage}>
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
          products={catalog.slice(0, 4)}
          wishlist={wishlist}
          onProduct={(product) => {
            setSelectedProduct(product);
            go("Product");
          }}
          onWishlist={toggleWishlist}
        />
        <ProductCarousel
          title="Best sellers"
          products={[...catalog].sort((a, b) => b.rating - a.rating).slice(0, 4)}
          wishlist={wishlist}
          onProduct={(product) => {
            setSelectedProduct(product);
            go("Product");
          }}
          onWishlist={toggleWishlist}
        />
        <View style={styles.lifestyle}>
          <Text style={styles.sectionTitle}>Movement with polish</Text>
          <Text style={styles.body}>
            From gym sets to soft layers, Noréa pieces are selected for fit, versatility and
            confident styling.
          </Text>
        </View>
        <View style={styles.reviewPanel}>
          <Text style={styles.sectionTitle}>Customer reviews</Text>
          <Text style={styles.body}>
            “The quality feels global, and the delivery updates made the order feel safe.”
          </Text>
          <Text style={styles.muted}>Tatenda R. • Verified buyer</Text>
        </View>
        <View style={styles.newsletter}>
          <Text style={styles.sectionTitle}>Noréa notes</Text>
          <Text style={styles.body}>Get drop alerts, delivery updates and restock notices.</Text>
          <PrimaryButton
            label="Enable notifications"
            onPress={async () => {
              const permissions = await Notifications.requestPermissionsAsync();
              if (!permissions.granted) {
                Alert.alert("Notifications", "You can enable notifications later in Settings.");
                return;
              }
              const token = (await Notifications.getExpoPushTokenAsync()).data;
              savePushToken(token).catch(() => undefined);
              setNotice("Push notifications enabled.");
            }}
          />
        </View>
        <WhatsAppButton />
      </ScrollView>
    );
  }

  if (screen === "Shop") {
    return frame(
      <ShopScreen
        products={catalog}
        wishlist={wishlist}
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
        onComplete={async (paymentMethod) => {
          if (!user) {
            Alert.alert("Sign in required", "Please sign in or register before checkout.");
            go("Login");
            return;
          }
          try {
            const result = await createOrder({
              items: cart,
              address: defaultAddress,
              paymentMethod
            });
            setOrders((current) => [result.order, ...current]);
            setCart([]);
            setNotice(result.paymentInstructions);
            if (result.redirectUrl) {
              Linking.openURL(result.redirectUrl);
            }
            go("Orders");
          } catch (error) {
            Alert.alert("Checkout failed", error instanceof Error ? error.message : "Please try again.");
          }
        }}
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
        onSupport={() => go("Support")}
        onNotifications={() => go("Notifications")}
        onLogout={async () => {
          await signOut();
          setUser(null);
          setNotice("Signed out securely.");
        }}
      />
    );
  }

  if (screen === "Notifications") {
    return frame(
      <SimpleScreen
        title="Notifications"
        body="Receive order tracking, delivery updates, restock notices and abandoned cart reminders. Noréa does not collect contacts, call logs or SMS logs."
        action="Enable notifications"
        onAction={async () => {
          const permissions = await Notifications.requestPermissionsAsync();
          setNotice(permissions.granted ? "Notifications enabled." : "Notifications remain off.");
        }}
      />
    );
  }

  if (screen === "Settings") {
    return frame(
      <SimpleScreen
        title="Settings"
        body="Manage saved addresses, privacy preferences and app security. Customer data is limited to name, email, phone number, delivery address and orders."
        action="Open privacy policy"
        onAction={() => Linking.openURL(appConfig.privacyUrl)}
      />
    );
  }

  return frame(
    <SimpleScreen
      title="Support"
      body="Need help with sizing, delivery, payments or returns? Message Noréa support on WhatsApp."
      action="WhatsApp support"
      onAction={() => Linking.openURL(appConfig.whatsappUrl)}
    />
  );
}

function TopBar({ onGo, cartCount }: { onGo: (screen: Screen) => void; cartCount: number }) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.logo}>NORÉA</Text>
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

function AuthScreen({
  mode,
  onSwitch,
  onSubmit
}: {
  mode: "Login" | "Register";
  onSwitch: () => void;
  onSubmit: (payload: { name: string; email: string; phone: string; password: string }) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.auth}>
      <Text style={styles.logo}>NORÉA</Text>
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
    </KeyboardAvoidingView>
  );
}

function ShopScreen({
  products,
  wishlist,
  onProduct,
  onWishlist
}: {
  products: Product[];
  wishlist: string[];
  onProduct: (product: Product) => void;
  onWishlist: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Best");

  const filtered = useMemo(() => {
    const next = products.filter((product) => {
      const text = `${product.title} ${product.category} ${product.description}`.toLowerCase();
      return (
        (category === "All" || product.category === category) &&
        text.includes(query.trim().toLowerCase())
      );
    });
    if (sort === "Price low") return [...next].sort((a, b) => a.priceUsd - b.priceUsd);
    if (sort === "Price high") return [...next].sort((a, b) => b.priceUsd - a.priceUsd);
    return [...next].sort((a, b) => b.rating - a.rating);
  }, [category, products, query, sort]);

  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Shop</Text>
      <TextInput
        style={styles.search}
        placeholder="Search leggings, hoodies, gym sets..."
        value={query}
        onChangeText={setQuery}
      />
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {product.gallery.map((image) => (
          <Image key={image} source={{ uri: image }} style={styles.detailImage} />
        ))}
      </ScrollView>
      <View style={styles.detailHead}>
        <View>
          <Text style={styles.badge}>{product.badge}</Text>
          <Text style={styles.pageTitle}>{product.title}</Text>
          <Text style={styles.price}>USD {product.priceUsd.toFixed(2)}</Text>
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
        label="Add to cart"
        onPress={() => {
          for (let index = 0; index < quantity; index += 1) onAdd(product, size, colour);
        }}
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
        <Text style={styles.body}>Your cart is ready for your next Noréa piece.</Text>
      ) : (
        cart.map((item, index) => (
          <View key={`${item.product.id}-${item.size}-${item.colour}`} style={styles.cartRow}>
            <Image source={{ uri: item.product.imageUrl }} style={styles.cartImage} />
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
  onComplete: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("PAYNOW");
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Checkout</Text>
      <Text style={styles.body}>
        Physical goods checkout uses secure external payment providers and bank/mobile money
        instructions. Noréa does not store card numbers.
      </Text>
      <InfoPanel title="Delivery" body="Nation-wide delivery in 6-10 days after payment confirmation." />
      <InfoPanel title="Order summary" body={`${cart.length} item(s) • USD ${total.toFixed(2)}`} />
      <Text style={styles.sectionTitle}>Payment method</Text>
      {paymentMethods.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.paymentRow, method === item.id && styles.paymentActive]}
          onPress={() => setMethod(item.id)}
        >
          <Ionicons name={method === item.id ? "radio-button-on" : "radio-button-off"} size={22} color={colors.rose} />
          <Text style={styles.cardTitle}>{item.label}</Text>
        </Pressable>
      ))}
      <PrimaryButton label="Place order securely" onPress={() => onComplete(method)} disabled={!cart.length} />
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
        <Text style={styles.body}>Your order tracking will appear here after checkout.</Text>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <Text style={styles.cardTitle}>Order {order.id}</Text>
            <Text style={styles.price}>USD {order.totalUsd.toFixed(2)}</Text>
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
  onSupport,
  onNotifications,
  onLogout
}: {
  user: User;
  onLogin: () => void;
  onOrders: () => void;
  onSettings: () => void;
  onSupport: () => void;
  onNotifications: () => void;
  onLogout: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Account</Text>
      <Text style={styles.body}>
        {user ? `Signed in as ${user.name}.` : "Sign in for saved addresses, order history and delivery updates."}
      </Text>
      {!user && <PrimaryButton label="Sign in or register" onPress={onLogin} />}
      <MenuRow label="Orders and tracking" icon="cube-outline" onPress={onOrders} />
      <MenuRow label="Notifications" icon="notifications-outline" onPress={onNotifications} />
      <MenuRow label="Settings and privacy" icon="settings-outline" onPress={onSettings} />
      <MenuRow label="Support" icon="logo-whatsapp" onPress={onSupport} />
      {user && <SecondaryButton label="Sign out" onPress={onLogout} />}
    </ScrollView>
  );
}

function SimpleScreen({
  title,
  body,
  action,
  onAction
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <PrimaryButton label={action} onPress={onAction} />
    </ScrollView>
  );
}

function ListScreen({
  title,
  empty,
  products,
  onProduct
}: {
  title: string;
  empty: string;
  products: Product[];
  onProduct: (product: Product) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>{title}</Text>
      {products.length === 0 ? (
        <Text style={styles.body}>{empty}</Text>
      ) : (
        products.map((product) => (
          <Pressable key={product.id} style={styles.listProduct} onPress={() => onProduct(product)}>
            <Image source={{ uri: product.imageUrl }} style={styles.cartImage} />
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
      <Image source={{ uri: product.imageUrl }} style={styles.cardImage} />
      <Pressable style={styles.heart} onPress={onWishlist}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={colors.rose} />
      </Pressable>
      <Text style={styles.badge}>{product.badge}</Text>
      <Text style={styles.cardTitle}>{product.title}</Text>
      <Text style={styles.muted}>{product.category} • ★ {product.rating.toFixed(1)}</Text>
      <Text style={styles.price}>USD {product.priceUsd.toFixed(2)}</Text>
    </Pressable>
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
  const statuses: Order["status"][] = ["Pending", "Paid", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const active = statuses.indexOf(status);
  return (
    <View style={styles.progress}>
      {statuses.map((item, index) => (
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
  keyboardType?: "default" | "email-address" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  const { label, ...inputProps } = props;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} autoCapitalize="none" {...inputProps} />
    </View>
  );
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

function WhatsAppButton() {
  return (
    <Pressable style={styles.whatsApp} onPress={() => Linking.openURL(appConfig.whatsappUrl)}>
      <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
      <Text style={styles.whatsAppText}>WhatsApp support</Text>
    </Pressable>
  );
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
  topActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  notice: { marginHorizontal: 18, marginBottom: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.pastelBlue, flexDirection: "row", gap: 8, alignItems: "center" },
  noticeText: { color: colors.navy, flex: 1, fontSize: 12 },
  scroll: { padding: 18, paddingBottom: 120 },
  screen: { flex: 1, paddingHorizontal: 18 },
  onboardingImage: { flex: 1, margin: 18, overflow: "hidden", justifyContent: "flex-end" },
  onboardingImageRadius: { borderRadius: radius.lg },
  onboardingShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(11,29,58,0.32)", borderRadius: radius.lg },
  onboardingCopy: { padding: 24 },
  onboardingActions: { padding: 18, gap: 10 },
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
  heart: { position: "absolute", right: 16, top: 16, backgroundColor: colors.white, borderRadius: radius.pill, padding: 7 },
  badge: { color: colors.rose, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginTop: 10, marginBottom: 4, fontWeight: "800" },
  cardTitle: { color: colors.navy, fontSize: 15, fontWeight: "800", letterSpacing: 0 },
  price: { color: colors.navy, fontSize: 16, fontWeight: "900", marginTop: 4 },
  rating: { color: colors.rose, marginTop: 4, fontWeight: "700" },
  lifestyle: { backgroundColor: colors.gray, borderRadius: radius.sm, padding: 18, marginTop: 10 },
  reviewPanel: { backgroundColor: colors.blush, borderRadius: radius.sm, padding: 18, marginTop: 14 },
  newsletter: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 18, marginTop: 14 },
  whatsApp: { backgroundColor: "#1FAF58", borderRadius: radius.pill, padding: 15, flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  whatsAppText: { color: colors.white, fontWeight: "800" },
  search: { backgroundColor: colors.gray, borderRadius: radius.pill, padding: 14, color: colors.navy, marginBottom: 12 },
  filterRow: { marginBottom: 10, maxHeight: 48 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginRight: 8, backgroundColor: colors.white },
  sortChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, marginRight: 8, backgroundColor: colors.gray },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  sortActive: { backgroundColor: colors.pastelBlue },
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
  orderCard: { padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, marginBottom: 12, backgroundColor: colors.white },
  progress: { marginTop: 12, gap: 8 },
  progressItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  progressDotActive: { backgroundColor: colors.rose },
  progressText: { color: colors.muted, fontSize: 12 },
  auth: { flex: 1, padding: 22, justifyContent: "center", backgroundColor: colors.white },
  inputGroup: { marginBottom: 12 },
  label: { color: colors.navy, fontWeight: "800", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 14, color: colors.navy, backgroundColor: colors.white },
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
