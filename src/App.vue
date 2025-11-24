<template>
  <div id="app">
    <header>
      <h1>Extra Class Lesson</h1>
      <button 
        @click="toggleView"
        :disabled="cart.length === 0 && currentView === 'lessons'"
        class="cart-button">
        <i class="fas fa-shopping-cart"></i> 
        {{ currentView === 'lessons' ? 'View Cart' : 'Back to Lessons' }} 
        ({{ cart.length }})
      </button>
    </header>

    <!-- LESSON LIST -->
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
          
          <!-- Lesson Details on the left -->
          <div class="lesson-details-side">
            <h3><i :class="lesson.icon"></i> {{ lesson.subject }}</h3>
            <p>📍 Location: {{ lesson.location }}</p>
            <p>💰 Price: £{{ Number(lesson.price).toFixed(2) }}</p>
            <p>🪑 Spaces Left: {{ lesson.spaces }}</p>
            
            <button 
              @click="addToCart(lesson)"
              :disabled="lesson.spaces <= 0"
              class="add-button">
              {{ lesson.spaces > 0 ? 'Add to Cart' : 'Fully Booked' }}
            </button>
          </div>

          <!-- Image on the right -->
          <div class="lesson-image">
            <img :src="lesson.imageUrl" :alt="lesson.subject" />
          </div>
        </div>
      </div>
    </main>

    <!-- CART -->
    <main v-else-if="currentView === 'cart'">
      <h2>🛒 Your Shopping Cart ({{ cart.length }} items)</h2>

      <div v-if="cart.length > 0" class="cart-items">
        <div v-for="(item, index) in cart" :key="item.orderId" class="cart-item">
          <div class="cart-item-details">
            <strong>{{ item.subject }}</strong>
            <p>📍 Location: {{ item.location }}</p>
            <p>💰 Price: £{{ Number(item.price).toFixed(2) }}</p>
            <p>🪑 Spaces Left: {{ item.spaces }}</p>
          </div>
          <button @click="removeFromCart(index, item.orderId, item.lessonId)" class="remove-button">
            Remove
          </button>
        </div>
      </div>
      <p v-else>Your cart is empty!</p>

      <!-- Cart Summary -->
      <div v-if="cart.length > 0" class="cart-summary">
        <hr>
        <p><strong>Total Price:</strong> £{{ totalPrice.toFixed(2) }}</p>
        <p><strong>Total Spaces Left:</strong> {{ totalSpaces }}</p>
      </div>

      <!-- Checkout Form -->
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
      API_BASE: 'https://extra-class-lesson-backend.onrender.com',
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
    isNameValid() { return /^[a-zA-Z\s]+$/.test(this.nameInput); },
    isPhoneValid() { return this.phoneInput === '' || /^[0-9]+$/.test(this.phoneInput); },
    isCheckoutEnabled() { return this.isNameValid && this.isPhoneValid && this.cart.length > 0; },

    filteredLessons() {
      const search = this.searchInput.toLowerCase().trim();
      if (!search) return this.lessons;
      return this.lessons.filter(lesson => {
        const subject = String(lesson.subject || '').toLowerCase();
        const location = String(lesson.location || '').toLowerCase();
        const price = String(lesson.price ?? '').toLowerCase();
        const spaces = String(lesson.spaces ?? '').toLowerCase();
        return subject.includes(search) || location.includes(search) || price.includes(search) || spaces.includes(search);
      });
    },
    sortedAndFilteredLessons() {
      const lessonsToSort = [...this.filteredLessons];
      return lessonsToSort.sort((a, b) => {
        const modifier = this.sortOrder === 'asc' ? 1 : -1;
        const key = this.sortBy;
        let valA = (key === 'subject') ? (a.subject || '') : (a[key] ?? '');
        let valB = (key === 'subject') ? (b.subject || '') : (b[key] ?? '');
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = String(valB).toLowerCase();
        }
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
    },

    totalPrice() {
      return this.cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
    },
    totalSpaces() {
      return this.cart.reduce((sum, item) => sum + Number(item.spaces || 0), 0);
    }
  },
  methods: {
    toggleView() {
      this.currentView = this.currentView === 'lessons' ? 'cart' : 'lessons';
      if (this.currentView === 'cart') {
        this.loadOrders();
      }
    },
    debouncedSearch(event) {
      clearTimeout(this.searchTimeout);
      const value = event.target.value;
      this.searchTimeout = setTimeout(() => { this.searchInput = value; }, 300);
    },

    async loadOrders() {
      try {
        const res = await fetch(`${this.API_BASE}/orders`);
        const ordersData = await res.json();
        this.cart = ordersData.map(order => ({
          orderId: order._id,
          lessonId: order.lessonIDs[0],
          subject: order.items[0]?.subject,
          price: order.items[0]?.price,
          location: order.items[0]?.location,
          spaces: order.items[0]?.spaces || 0
        }));
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    },

    async addToCart(lesson) {
      if (lesson.spaces <= 0) return;
      lesson.spaces -= 1;

      const orderPayload = {
        name: "Temp",
        phone: "",
        lessonIDs: [lesson._id],
        items: [{ lessonId: lesson._id, subject: lesson.subject, price: lesson.price, location: lesson.location, spaces: lesson.spaces }],
        createdAt: new Date()
      };

      try {
        const res = await fetch(`${this.API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        this.cart.push({ 
          orderId: data.orderId, 
          lessonId: lesson._id, 
          subject: lesson.subject, 
          price: lesson.price, 
          location: lesson.location, 
          spaces: lesson.spaces 
        });
      } catch (err) { console.error(err); }

      await fetch(`${this.API_BASE}/lessons/${lesson._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaces: lesson.spaces })
      });

      this.orderSubmitted = false;
    },

    async removeFromCart(index, orderId, lessonId) {
      try {
        await fetch(`${this.API_BASE}/orders/${orderId}`, { method: 'DELETE' });
        this.cart.splice(index, 1);

        const lesson = this.lessons.find(l => l._id === lessonId);
        if (lesson) {
          lesson.spaces += 1;
          await fetch(`${this.API_BASE}/lessons/${lesson._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spaces: lesson.spaces }) });
        }
      } catch (err) { console.error(err); }
    },

    async checkoutOrder() {
      if (!this.isCheckoutEnabled) return;

      const totalPrice = this.cart.reduce((sum, item) => sum + Number(item.price || 0), 0);
      const totalSpaces = this.cart.reduce((sum, item) => sum + Number(item.spaces || 0), 0);

      const orderPayload = {
        name: this.nameInput,
        phone: this.phoneInput,
        lessonIDs: this.cart.map(item => item.lessonId),
        items: this.cart.map(item => ({ lessonId: item.lessonId, subject: item.subject, price: item.price, location: item.location, spaces: item.spaces })),
        totalPrice: totalPrice,
        totalSpaces: totalSpaces,
        createdAt: new Date()
      };

      try {
        const res = await fetch(`${this.API_BASE}/orders`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(orderPayload) 
        });
        if (!res.ok) return console.error('Order failed');
        const data = await res.json();
        console.log('Order saved:', data);

        this.orderNameConfirmation = this.nameInput;
        this.orderSubmitted = true;

        this.cart = [];
        this.nameInput = '';
        this.phoneInput = '';
        this.currentView = 'lessons';
      } catch (err) { console.error('Network error sending order:', err); }
    }
  },

  async mounted() {
    const lessonsRes = await fetch(`${this.API_BASE}/lessons`);
    const lessonsData = await lessonsRes.json();
    this.lessons = lessonsData.map(item => ({
      _id: item._id, 
      subject: item.subject || 'Untitled', 
      location: item.location || '', 
      price: Number(item.price || 0), 
      spaces: Number(item.spaces ?? 0), 
      icon: item.icon || 'fas fa-book',
      imageUrl: item.imageUrl || '/images/default.jpg'
    }));
  },

  beforeUnmount() {
    clearTimeout(this.searchTimeout);
  }
}
</script>

<style>
/* --- Global Styles --- */
#app { font-family: sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
h1, h2, h3, p { color: #333; } 

/* --- Header --- */
header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
.cart-button { padding: 10px 15px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
.cart-button:disabled { background-color: #ccc; cursor: not-allowed; }

/* --- Controls --- */
.controls { display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; margin-bottom: 20px; gap: 20px; }
.search-input { flex-grow: 1; padding: 10px 15px; border: 2px solid #ccc; border-radius: 20px; font-size: 1em; }
.search-input:focus { border-color: #1a73e8; outline: none; box-shadow: 0 0 5px rgba(26, 115, 232, 0.2); }
.sort-controls { display: flex; align-items: center; gap: 10px; }
.sort-label { font-weight: 600; color: #555; }
.sort-select, .order-button { padding: 8px 10px; border-radius: 4px; cursor: pointer; }
.order-button { background-color: #f0f4f8; color: #444; border: 1px solid #ccc; }

/* --- Lesson Card --- */
.lesson-card { display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: white; min-height: 180px; box-shadow: 2px 2px 5px rgba(0,0,0,0.05); }
.lesson-image img { width: 150px; object-fit: cover; border-left: 1px solid #ddd; }
.lesson-details-side { width: 100%; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
.lesson-details-side h3 { margin-top: 0; margin-bottom: 10px; color: #007bff; font-weight: 700; }
.lesson-details-side h3 i { color: #1a73e8; }
.lesson-details-side p { margin-bottom: 5px; font-weight: 600; }
.add-button { width: 100%; margin-top: 15px; padding: 10px 15px; background-color: #2196F3; color: white; border: none; cursor: pointer; }
.add-button:disabled { background-color: #ccc; cursor: not-allowed; }

/* --- Grid Layout --- */
.lesson-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }

/* --- Cart --- */
.cart-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px; border-bottom: 1px dashed #eee; }
.cart-item-details p { margin: 2px 0; font-size: 0.9em; }
.remove-button { background-color: #f44336; color: white; border: none; padding: 5px 10px; cursor: pointer; }

/* --- Checkout --- */
.checkout-form { padding: 20px; border: 1px solid #ddd; margin-top: 20px; }
.form-group { margin-bottom: 10px; }
.error { color: red; font-size: 0.8em; display: block; }
.success-message { color: green; font-weight: bold; padding: 10px; background-color: #e8f5e9; border-radius: 4px; }

/* --- Cart Summary --- */
.cart-summary { margin-top: 15px; padding: 10px 0; font-size: 1em; font-weight: 600; color: #333; }
.cart-summary p { margin: 5px 0; }
</style>
