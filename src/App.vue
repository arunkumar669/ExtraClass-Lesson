<template>
  <div id="app">
    <header>
      <h1>Extra Class Lessons</h1>
      <button 
        @click="currentView = currentView === 'lessons' ? 'cart' : 'lessons'"
        :disabled="cart.length === 0 && currentView === 'lessons'"
        class="cart-button">
        <i class="fas fa-shopping-cart"></i> 
        {{ currentView === 'lessons' ? 'View Cart' : 'Back to Lessons' }} 
        ({{ cart.length }})
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
          <!-- IMAGE AT TOP -->
          <img :src="$api + lesson.image" :alt="lesson.subject" class="lesson-image">

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
        </div>
      </div>
    </main>

    <!-- CART VIEW -->
    <main v-else-if="currentView === 'cart'">
      <h2>🛒 Your Shopping Cart ({{ cart.length }} items)</h2>

      <div v-if="cart.length > 0" class="cart-items">
        <div v-for="(item, index) in cart" :key="item.lessonId" class="cart-item">
          <div class="cart-item-details">
            <strong>{{ item.subject }}</strong>
            <p>📍 Location: {{ item.location }}</p>
            <p>💰 Price: £{{ Number(item.price).toFixed(2) }}</p>
            <p>Quantity: {{ item.quantity }}</p>
          </div>
          <button @click="removeFromCart(index)" class="remove-button">Remove</button>
        </div>
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
        <p v-if="orderError" class="error-message">
          ❌ {{ orderError }}
        </p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
  
  data() {
    return {
      lessons: [],
      sortBy: "subject",
      sortOrder: "asc",
      searchInput: "",
      searchTimeout: null,
      currentView: "lessons",

      cart: [],
      nameInput: "",
      phoneInput: "",
      orderSubmitted: false,
      orderNameConfirmation: "",
      orderError: ""
    };
  },

  computed: {
    isNameValid() {
      return /^[a-zA-Z\s]+$/.test(this.nameInput);
    },
    isPhoneValid() {
      return this.phoneInput === "" || /^[0-9]+$/.test(this.phoneInput);
    },
    isCheckoutEnabled() {
      return this.isNameValid && this.isPhoneValid && this.cart.length > 0;
    },
    filteredLessons() {
      const search = this.searchInput.toLowerCase().trim();
      if (!search) return this.lessons;
      return this.lessons.filter(lesson => {
        return (
          lesson.subject.toLowerCase().includes(search) ||
          lesson.location.toLowerCase().includes(search) ||
          String(lesson.price).includes(search) ||
          String(lesson.spaces).includes(search)
        );
      });
    },
    sortedAndFilteredLessons() {
      const sorted = [...this.filteredLessons];
      sorted.sort((a, b) => {
        const modifier = this.sortOrder === "asc" ? 1 : -1;
        let valA = a[this.sortBy];
        let valB = b[this.sortBy];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
      return sorted;
    }
  },

  methods: {
    debouncedSearch(event) {
      clearTimeout(this.searchTimeout);
      const value = event.target.value;
      this.searchTimeout = setTimeout(() => {
        this.searchInput = value;
      }, 300);
    },

    addToCart(lesson) {
      if (lesson.spaces <= 0) return; // Prevent adding if fully booked

      const cartItem = this.cart.find(item => item.lessonId === lesson._id);

      if (cartItem) {
        cartItem.quantity += 1;
      } else {
        this.cart.push({
          lessonId: lesson._id,
          subject: lesson.subject,
          price: Number(lesson.price),
          location: lesson.location,
          quantity: 1,
          lessonRef: lesson // reference to original lesson
        });
      }

      // Decrease the available spaces
      lesson.spaces -= 1;

      this.orderSubmitted = false;
      this.orderError = "";
    },

    removeFromCart(index) {
      const cartItem = this.cart[index];

      // Restore spaces to the original lesson
      const originalLesson = this.lessons.find(l => l._id === cartItem.lessonId);
      if (originalLesson) {
        originalLesson.spaces += cartItem.quantity;
      }

      // Remove item from cart
      this.cart.splice(index, 1);
    },

    async checkoutOrder() {
      if (!this.isCheckoutEnabled) return;

      try {
        const payload = {
          name: this.nameInput,
          phone: this.phoneInput,
          lessonIDs: this.cart.map(item => item.lessonId),
          items: this.cart.map(item => ({
            lessonId: item.lessonId,
            subject: item.subject,
            price: item.price,
            quantity: item.quantity
          }))
        };

        const res = await fetch(`${this.$api}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
          this.orderError = data.error || "Order failed";
          return;
        }

        this.orderSubmitted = true;
        this.orderNameConfirmation = this.nameInput;
        this.orderError = "";

        this.cart = [];
        this.nameInput = "";
        this.phoneInput = "";

        await this.fetchLessons();

        setTimeout(() => {
          this.currentView = "lessons";
          this.orderSubmitted = false;
        }, 3000);

      } catch (err) {
        this.orderError = "Network error";
      }
    },

    async fetchLessons() {
      const res = await fetch(`${this.$api}/lessons`);
      this.lessons = await res.json();
    }
  },

  mounted() {
    this.fetchLessons();
  }
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1,h2,h3,p {
  color:#333;
}

header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  border-bottom:2px solid #ccc;
  padding-bottom:10px;
  margin-bottom:20px;
}

.cart-button {
  padding:10px 15px;
  background-color:#4CAF50;
  color:white;
  border:none;
  cursor:pointer;
}

.cart-button:disabled {
  background-color:#ccc;
  cursor:not-allowed;
}

.controls {
  display:flex;
  align-items:center;
  padding:15px 0;
  border-bottom:1px solid #eee;
  margin-bottom:20px;
  gap:20px;
}

.search-input {
  flex-grow:1;
  padding:10px 15px;
  border:2px solid #ccc;
  border-radius:20px;
  font-size:1em;
}

.sort-controls {
  display:flex;
  align-items:center;
  gap:10px;
}

.lesson-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
  gap:20px;
}

.lesson-card {
  display:flex;
  flex-direction: column;
  border:1px solid #ddd;
  border-radius:8px;
  box-shadow:2px 2px 5px rgba(0,0,0,0.05);
  background:white;
  min-height:250px;
}

.lesson-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.lesson-details-side {
  width:100%;
  padding:15px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}

.lesson-details-side h3 {
  margin-top:0;
  margin-bottom:10px;
  color:#007bff;
  font-weight:700;
}

.add-button {
  background-color:#2196F3;
  color:white;
  border:none;
  padding:10px 0;
  cursor:pointer;
}

.add-button:disabled {
  background-color:#ccc;
  cursor:not-allowed;
}

.cart-item {
  display:flex;
  justify-content:space-between;
  padding:10px;
  border-bottom:1px dashed #eee;
}

.remove-button {
  background-color:#f44336;
  color:white;
  border:none;
  padding:5px 10px;
  cursor:pointer;
}

.checkout-form {
  padding:20px;
  border:1px solid #ddd;
  margin-top:20px;
}

.form-group {
  margin-bottom:15px;
}

.error {
  color:red;
  font-size:0.8em;
}

.success-message {
  color:green;
  font-weight:bold;
  padding:10px;
  background-color:#e8f5e9;
  border-radius:4px;
}

.error-message {
  color:red;
  font-weight:bold;
  padding:10px;
  background-color:#fbe9e7;
  border-radius:4px;
}

.order-button, .checkout-button {
  padding: 8px 12px;
  border:none;
  cursor:pointer;
  border-radius:4px;
  background-color:#007bff;
  color:white;
}

.order-button:hover, .checkout-button:hover {
  opacity:0.9;
}
</style>
