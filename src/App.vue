<template>
  <div id="app">
    <header class="app-header">
      <h1>Extra Class Lesson</h1>

      <button 
        @click="isCartVisible = !isCartVisible"
        :disabled="cart.length === 0 && isCartVisible"
        class="cart-button"
      >
        {{ isCartVisible ? '<< Back to Lessons' : 'View Cart' }} ({{ cart.length }})
      </button>
    </header>

    <!-- SEARCH & SORT -->
    <div v-if="!isCartVisible" class="controls">
      <input 
        :value="searchQuery"
        @input="debouncedSearch"
        type="text"
        placeholder="Search by subject or location..."
        class="search-input"
      />

      <div class="sort-controls">
        <label for="sort-by">Sort by:</label>
        <select id="sort-by" v-model="sortBy">
          <option value="subject">Subject</option>
          <option value="price">Price</option>
          <option value="spaces">Spaces</option>
        </select>

        <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'">
          {{ sortOrder === 'asc' ? 'Asc' : 'Desc' }}
        </button>
      </div>
    </div>

    <!-- LESSONS VIEW -->
    <main v-if="!isCartVisible" class="lessons-view">
      <div class="lesson-list">
        <div 
          v-for="lesson in sortedAndFilteredLessons" 
          :key="lesson.id" 
          class="lesson-card"
        >
          <div class="lesson-details">
            <span class="lesson-icon">{{ lesson.icon }}</span>
            <h3>{{ lesson.subject }}</h3>
            <p><strong>Location:</strong> {{ lesson.location }}</p>
            <p><strong>Price:</strong> £{{ lesson.price }}</p>
            <p><strong>Spaces Left:</strong> {{ lesson.spaces }}</p>
          </div>

          <button
            class="add-to-cart-button"
            :disabled="lesson.spaces === 0"
            @click="addToCart(lesson)"
          >
            {{ lesson.spaces === 0 ? 'Full' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    </main>

    <!-- CART VIEW -->
    <main v-else class="cart-view">
      <h2>Shopping Cart</h2>

      <div v-if="cart.length > 0">
        <div 
          v-for="(item, index) in cart" 
          :key="index"
          class="cart-item"
        >
          <p><strong>{{ item.subject }}</strong></p>
          <p>Location: {{ item.location }}</p>
          <p>Price: £{{ item.price }}</p>

          <button class="remove-btn" @click="removeFromCart(index)">
            Remove
          </button>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary">
          <p><strong>Total Items:</strong> {{ cart.length }}</p>
          <p><strong>Total Price:</strong> £{{ totalPrice.toFixed(2) }}</p>
        </div>

        <!-- Checkout Form -->
        <div class="checkout-form">
          <h3>Checkout</h3>
          <div class="form-group">
            <label for="name">Name:</label>
            <input 
              id="name" 
              type="text" 
              v-model="checkoutName" 
              placeholder="Your Name" 
            />
            <span v-if="checkoutName && !isNameValid" class="error">
              Name must contain only letters and spaces.
            </span>
          </div>

          <div class="form-group">
            <label for="phone">Phone:</label>
            <input 
              id="phone" 
              type="tel" 
              v-model="checkoutPhone" 
              placeholder="Your Phone" 
            />
            <span v-if="checkoutPhone && !isPhoneValid" class="error">
              Phone must contain only numbers.
            </span>
          </div>

          <button 
            class="checkout-btn" 
            :disabled="!isCheckoutEnabled"
            @click="submitOrder"
          >
            Submit Order
          </button>

          <p v-if="orderSuccess" class="success-message">
            ✅ Order submitted successfully! Thank you, {{ checkoutName }}.
          </p>
        </div>
      </div>

      <p v-else>Your cart is empty.</p>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

// LESSON DATA
const lessons = ref([
  { id: 1, subject: "Math", location: "Room 101, Main Building, London", price: 15, spaces: 5, icon: "📐" },
  { id: 2, subject: "English", location: "Library Annex, Kensington", price: 12.5, spaces: 5, icon: "📚" },
  { id: 3, subject: "Physics", location: "Lab A, Westminster", price: 18, spaces: 5, icon: "🔭" },
  { id: 4, subject: "Chemistry", location: "Lab B, Westminster", price: 18, spaces: 5, icon: "⚗️" },
  { id: 5, subject: "History", location: "Room 205, Culture Street", price: 10, spaces: 5, icon: "📜" },
  { id: 6, subject: "Geography", location: "Room 206, Culture Street", price: 10, spaces: 5, icon: "🌍" },
  { id: 7, subject: "Art", location: "Studio 3, Shoreditch", price: 22, spaces: 5, icon: "🎨" },
  { id: 8, subject: "Music", location: "Studio 4, Shoreditch", price: 22, spaces: 5, icon: "🎶" },
  { id: 9, subject: "PE", location: "Sports Complex, Greenwich", price: 8, spaces: 5, icon: "⚽" },
  { id: 10, subject: "Programming", location: "Online via Zoom", price: 25, spaces: 5, icon: "💻" }
]);

const cart = ref([]);
const isCartVisible = ref(false);

// SEARCH & SORT
const searchQuery = ref("");
const sortBy = ref("subject");
const sortOrder = ref("asc");
let searchTimeout = null;

// FILTERED LESSONS WITH DEBOUNCE
const filteredLessons = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return lessons.value.filter(lesson => 
    lesson.subject.toLowerCase().includes(query) ||
    lesson.location.toLowerCase().includes(query)
  );
});

// SORTED AND FILTERED LESSONS
const sortedAndFilteredLessons = computed(() => {
  return [...filteredLessons.value].sort((a, b) => {
    let valA = a[sortBy.value];
    let valB = b[sortBy.value];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});

// DEBOUNCE FUNCTION
function debouncedSearch(event) {
  clearTimeout(searchTimeout);
  const value = event.target.value;
  searchTimeout = setTimeout(() => {
    searchQuery.value = value;
  }, 300);
}

// ADD TO CART
function addToCart(lesson) {
  if (lesson.spaces === 0) return;
  lesson.spaces--;
  cart.value.push({
    subject: lesson.subject,
    price: lesson.price,
    location: lesson.location
  });
}

// REMOVE FROM CART
function removeFromCart(index) {
  const removed = cart.value.splice(index, 1)[0];
  const lesson = lessons.value.find(l => 
    l.subject === removed.subject && l.location === removed.location
  );
  if (lesson) lesson.spaces++;
}

// CART TOTAL
const totalPrice = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price, 0);
});

// CHECKOUT FORM
const checkoutName = ref("");
const checkoutPhone = ref("");
const orderSuccess = ref(false);

// FORM VALIDATION
const isNameValid = computed(() => /^[a-zA-Z\s]+$/.test(checkoutName.value));
const isPhoneValid = computed(() => /^[0-9]+$/.test(checkoutPhone.value));
const isCheckoutEnabled = computed(() => cart.value.length > 0 && isNameValid.value && isPhoneValid.value);

// SUBMIT ORDER
function submitOrder() {
  if (!isCheckoutEnabled.value) return;
  console.log("Order submitted:", {
    name: checkoutName.value,
    phone: checkoutPhone.value,
    items: cart.value
  });
  orderSuccess.value = true;
  cart.value = [];
  checkoutName.value = "";
  checkoutPhone.value = "";
}

// --- PERSIST CART TO localStorage ---
watch(cart, (newCart) => {
  localStorage.setItem('lessonCart', JSON.stringify(newCart));
}, { deep: true });

onMounted(() => {
  const storedCart = JSON.parse(localStorage.getItem('lessonCart') || '[]');
  cart.value = storedCart;
  storedCart.forEach(item => {
    const lesson = lessons.value.find(l => 
      l.subject === item.subject && l.location === item.location
    );
    if (lesson) lesson.spaces--;
  });
});
</script>

<style scoped>
/* same styles as previous commit */
</style>
