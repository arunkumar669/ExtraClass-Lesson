<template>
  <div id="app">
    <header>
      <h1>Extra Class Lesson</h1>
      <button 
        @click="currentView = currentView === 'lessons' ? 'cart' : 'lessons'"
        :disabled="totalCartQuantity === 0 && currentView === 'lessons'"
        class="cart-button">
        <i class="fas fa-shopping-cart"></i> 
        {{ currentView === 'lessons' ? 'View Cart' : 'Back to Lessons' }} 
        ({{ totalCartQuantity }})
      </button>
    </header>

    <!-- LESSONS VIEW -->
    <main v-if="currentView === 'lessons'">
      <div class="controls">
        <input 
          :value="searchInput"
          @input="debouncedSearch"
          placeholder="Search lessons (subject, location, price, spaces)"
          class="search-input">
        
        <div class="sort-controls">
          <label class="sort-label">Sort By:</label>
          <select v-model="sortBy" class="sort-select">
            <option value="subject">Subject</option>
            <option value="location">Location</option>
            <option value="price">Price</option>
            <option value="spaces">Spaces</option>
          </select>
          <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="order-button">
            Order: {{ sortOrder === 'asc' ? 'Ascending' : 'Descending' }}
          </button>
        </div>
      </div>

      <h2>Available Lessons ({{ sortedAndFilteredLessons.length }} found)</h2>

      <div class="lesson-grid">
        <div v-for="lesson in sortedAndFilteredLessons" :key="lesson._id" class="lesson-card">
          <img :src="lesson.image || '/images/default.jpg'" alt="Lesson Image" class="lesson-image">

          <div class="lesson-details">
            <h3><i :class="lesson.icon"></i> {{ lesson.subject }}</h3>
            <p>📍 Location: {{ lesson.location }}</p>
            <p>💰 Price: £{{ Number(lesson.price).toFixed(2) }}</p>
            <p>🪑 Spaces Left: {{ lesson.spaces }}</p>
            
            <button 
              @click="addToCart(lesson)"
              :disabled="lesson.spaces <= 0"
              class="add-button">
              {{ lesson.spaces <= 0 ? 'Fully Booked' : 'Add to Cart' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- CART VIEW -->
    <main v-else-if="currentView === 'cart'">
      <h2>🛒 Your Shopping Cart ({{ totalCartQuantity }} items)</h2>

      <div v-if="cart.length > 0" class="cart-items">
        <div v-for="(item, index) in cart" :key="index" class="cart-item">
          <div class="cart-item-details">
            <strong>{{ item.subject }} (x{{ item.quantity }})</strong>
            <p>📍 Location: {{ item.location }}</p>
            <p>💰 Total: £{{ (item.price * item.quantity).toFixed(2) }}</p>
          </div>
          <button @click="removeFromCart(index)" class="remove-button">Remove</button>
        </div>
        <p><strong>Total Price: £{{ totalCartPrice }}</strong></p>
      </div>
      <p v-else>Your cart is empty!</p>

      <hr>

      <div class="checkout-form">
        <h3>Checkout Details</h3>
        <div class="form-group">
          <label for="name">Name:</label>
          <input type="text" id="name" v-model="nameInput" placeholder="Name (Letters/spaces only)">
          <span v-if="nameInput && !isNameValid" class="error">Name must be letters and spaces only.</span>
        </div>
        <div class="form-group">
          <label for="phone">Phone:</label>
          <input type="tel" id="phone" v-model="phoneInput" placeholder="Phone (Numbers only)">
          <span v-if="phoneInput && !isPhoneValid" class="error">Phone must be numbers only.</span>
        </div>
        
        <button 
          @click="checkoutOrder" 
          :disabled="!isCheckoutEnabled"
          class="checkout-button">
          Complete Order
        </button>
        
        <p v-if="orderSubmitted" class="success-message">
          ✅ Order Submitted! Thank you, <strong>{{ orderNameConfirmation }}</strong>.
        </p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    this.searchTimeout = null;
    return {
      API_BASE: 'http://localhost:3000',
      lessons: [],
      sortBy: 'subject',
      sortOrder: 'asc',
      searchInput: '',
      currentView: 'lessons',
      cart: [],
      nameInput: '',
      phoneInput: '',
      orderSubmitted: false,
      orderNameConfirmation: ''
    };
  },
  computed: {
    isNameValid() {
      return /^[a-zA-Z\s]+$/.test(this.nameInput);
    },
    isPhoneValid() {
      return this.phoneInput === '' || /^[0-9]+$/.test(this.phoneInput);
    },
    isCheckoutEnabled() {
      return this.isNameValid && this.isPhoneValid && this.cart.length > 0;
    },
    totalCartQuantity() {
      return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    },
    totalCartPrice() {
      return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
    },
    filteredLessons() {
      const search = this.searchInput.toLowerCase().trim();
      if (!search) return this.lessons;
      return this.lessons.filter(lesson => {
        return String(lesson.subject).toLowerCase().includes(search) ||
               String(lesson.location).toLowerCase().includes(search) ||
               String(lesson.price).includes(search) ||
               String(lesson.spaces).includes(search);
      });
    },
    sortedAndFilteredLessons() {
      const lessonsToSort = [...this.filteredLessons];
      return lessonsToSort.sort((a, b) => {
        const modifier = this.sortOrder === 'asc' ? 1 : -1;
        const key = this.sortBy;
        let valA = a[key];
        let valB = b[key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
    }
  },
  methods: {
    async fetchLessons(searchQuery = "") {
  try {
    const url = searchQuery 
      ? `${this.API_BASE}/lessons/search?query=${encodeURIComponent(searchQuery)}`
      : `${this.API_BASE}/lessons`;

    const res = await fetch(url);
    const data = await res.json();

    this.lessons = data.map(item => ({
      _id: item._id,
      subject: item.subject || 'Untitled',
      location: item.location || '',
      price: Number(item.price || 0),
      spaces: Number(item.spaces ?? 0),
      icon: item.icon || 'fas fa-book',
      
      // ⬇️ FIXED IMAGE PATH — ONLY CHANGE I MADE ⬇️
      image: item.image 
        ? `${this.API_BASE}/${item.image}`
        : `${this.API_BASE}/images/default.jpg`
    }));

  } catch (err) {
    console.error("Fetch error:", err);
  }
},

    debouncedSearch(event) {
      clearTimeout(this.searchTimeout);
      const value = event.target.value;
      this.searchTimeout = setTimeout(() => {
        this.searchInput = value;
        this.fetchLessons(value);
      }, 300);
    },
    addToCart(lesson) {
      if (lesson.spaces <= 0) return;
      const cartItem = this.cart.find(c => c.lessonId === lesson._id);
      if (cartItem) cartItem.quantity += 1;
      else this.cart.push({
        lessonId: lesson._id,
        subject: lesson.subject,
        price: Number(lesson.price),
        location: lesson.location,
        quantity: 1
      });
      lesson.spaces -= 1;
      this.orderSubmitted = false;
    },
    removeFromCart(index) {
      const item = this.cart[index];
      const lesson = this.lessons.find(l => l._id === item.lessonId);
      if (lesson) lesson.spaces += item.quantity;
      this.cart.splice(index, 1);
    },
    async checkoutOrder() {
      if (!this.isCheckoutEnabled) return;
      try {
        const orderPayload = {
          name: this.nameInput,
          phone: this.phoneInput,
          lessonIDs: this.cart.flatMap(item => Array(item.quantity).fill(item.lessonId)),
          items: this.cart.map(item => ({
            lessonId: item.lessonId,
            subject: item.subject,
            price: item.price,
            quantity: item.quantity
          }))
        };
        const res = await fetch(`${this.API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        if (!res.ok) { alert("Order failed: " + data.error); return; }

        this.orderNameConfirmation = this.nameInput;
        this.orderSubmitted = true;
        this.nameInput = "";
        this.phoneInput = "";
        this.cart = [];
        await this.fetchLessons();
        setTimeout(() => {
          this.orderSubmitted = false;
          this.currentView = "lessons";
        }, 2500);
      } catch (err) {
        console.error("Checkout error:", err);
        alert("Network error. Try again.");
      }
    }
  },
  mounted() { this.fetchLessons(); },
  beforeUnmount() { clearTimeout(this.searchTimeout); }
}
</script>

<style>
/* --- Global Styles --- */
#app { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
h1, h2, h3, p { color: #333; } 

/* --- HEADER AND CART BUTTON --- */
header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
.cart-button { padding: 10px 15px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
.cart-button:disabled { background-color: #ccc; cursor: not-allowed; }

/* --- CONTROLS AND LAYOUT --- */
.controls { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; margin-bottom: 20px; gap: 20px; }
.search-input { flex-grow: 1; padding: 10px 15px; border: 2px solid #ccc; border-radius: 20px; font-size: 1em; transition: border-color 0.3s ease; }
.search-input:focus { border-color: #1a73e8; outline: none; box-shadow: 0 0 5px rgba(26,115,232,0.2); }
.sort-controls { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
.sort-label { font-weight: 600; color: #555; }
.sort-select { padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; cursor: pointer; }
.order-button { padding: 8px 15px; background-color: #f0f4f8; color: #444; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-weight: 500; }
.order-button:hover { background-color: #e0e6ed; border-color: #aaa; }

/* --- LESSON CARD --- */
.lesson-card { display: flex; flex-direction: column; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: white; box-shadow: 2px 2px 5px rgba(0,0,0,0.05); min-height: 300px; }
.lesson-image { width: 100%; height: 180px; object-fit: cover; }
.lesson-details { padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
.lesson-details h3 { margin-top: 0; margin-bottom: 10px; color: #007bff; font-weight: 700; }
.lesson-details h3 i { color: #1a73e8; }
.lesson-details p { margin-bottom: 5px; color: #333; font-weight: 600; }
.lesson-details .add-button { width: 100%; margin-top: 15px; padding: 10px 15px; }

/* --- Grid Layout --- */
.lesson-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

/* --- OTHER STYLES --- */
header h1 { font-size: 2.5em; font-weight: 700; color: #1a73e8; margin: 0; }
main h2 { font-size: 1.8em; font-weight: 600; color: #444; padding-left: 5px; border-bottom: 3px solid #f0f0f0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 20px; }
.checkout-form h3 { font-size: 1.5em; font-weight: 600; color: #333; margin-bottom: 15px; border-left: 4px solid #4CAF50; padding-left: 10px; }
.add-button { background-color: #2196F3; color: white; border: none; cursor: pointer; } 
.add-button:disabled { background-color: #ccc; cursor: not-allowed; }
.cart-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px; border-bottom: 1px dashed #eee; }
.cart-item-details p { margin: 2px 0; font-size: 0.9em; }
.remove-button { background-color: #f44336; color: white; border: none; padding: 5px 10px; cursor: pointer; }
.checkout-form { padding: 20px; border: 1px solid #ddd; margin-top: 20px; }
.form-group { margin-bottom: 10px; }
.error { color: red; font-size: 0.8em; display: block; }
.success-message { color: green; font-weight: bold; padding: 10px; background-color: #e8f5e9; border-radius: 4px; }
</style>
