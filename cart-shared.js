/* ═══════════════════════════════════════════════════════════
   Grand Gesture — Shared Cart Logic
   Single source of truth for cart, badge, modal & recommendations
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Helpers ── */
  const formatKsh = (num) => "KSh " + Number(num).toLocaleString("en-US");

  function getCartItems() {
    return JSON.parse(localStorage.getItem("cartItems")) || [];
  }

  function saveCartItems(items) {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }

  /* ── Badge ── */
  function updateCartBadge() {
    const items = getCartItems();
    const total = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    document.querySelectorAll(".cart-badge").forEach((badge) => {
      badge.textContent = total;
      badge.style.display = total > 0 ? "flex" : "none";
    });
  }

  /* ── Recommendations Data ── */
  const recData = [
    { name: "Hisense 55 ULED Mini LED U6 Pro", price: 63800, category: "TVs", image: "images/Hisense 55 ULED Mini LED U6 Pro.png" },
    { name: "Hisense AX3100G 3.1CH Soundbar", price: 19000, category: "Sound Bars", image: "images/Hisense AX3100G 3.1CH Soundbar, 280W – Black.png" },
    { name: "Hisense 10.5/6kg Wash & Dry", price: 58000, category: "Washing Machines", image: "images/Washing machine Front load 10.5 6kg.png" },
    { name: "Hisense 12000 BTU Air Conditioner", price: 45000, category: "Air Conditioners", image: "images/Air conditioner 2.png" },
    { name: "Hisense Fridge 424L Double Door", price: 63000, category: "Refrigerators", image: "images/Hisense Fridge 424L Double Door Silver REF418DR.png" },
    { name: "Hisense 6.3L Air Fryer", price: 12000, category: "Kitchen Appliances", image: "images/Hisense 6.3L Air Fryer H06AFBS1S3.png" },
  ];

  function getRecommendation(addedCategory) {
    if (!addedCategory) return recData[1];
    const cat = addedCategory.toLowerCase();
    let recCat = "Sound Bars";
    if (cat.includes("tv")) recCat = "Sound Bars";
    else if (cat.includes("sound")) recCat = "TVs";
    else if (cat.includes("wash")) recCat = "Air Conditioners";
    else if (cat.includes("refrigerator") || cat.includes("fridge") || cat.includes("freezer")) recCat = "Kitchen Appliances";
    else if (cat.includes("kitchen") || cat.includes("microwave") || cat.includes("air fryer")) recCat = "Refrigerators";
    else if (cat.includes("air") || cat.includes("conditioner")) recCat = "Washing Machines";
    return recData.find((r) => r.category === recCat) || recData[0];
  }

  /* ── Path helpers ── */
  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/categories/") || path.includes("/brands/") || path.includes("/products/")) {
      return "../";
    }
    return "";
  }

  /* ── Add to Cart ── */
  function addItemToCart(item) {
    let cartItems = getCartItems();
    const existing = cartItems.find((ci) => ci.name === item.name);
    let isNew = false;

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cartItems.push(
        Object.assign({}, item, {
          id: item.id || item.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now(),
          quantity: 1,
        })
      );
      isNew = true;
    }

    saveCartItems(cartItems);
    updateCartBadge();
    showCartModal(item, isNew);
  }

  /* ── Cart Modal ── */
  function showCartModal(item, isNew) {
    const modal = document.getElementById("cart-modal");
    if (!modal) return;

    const title = document.getElementById("cart-modal-title");
    const msg = document.getElementById("cart-modal-msg");

    if (title) {
      title.textContent = isNew ? "Added to Cart!" : "Cart Updated!";
    }
    if (msg) {
      msg.textContent = isNew
        ? item.name + " was added to your cart."
        : item.name + " is already in your cart. We increased the quantity.";
    }

    /* Recommendations */
    const recsBlock = document.getElementById("cart-modal-recs");
    const recContainer = document.getElementById("rec-item-container");
    const rec = getRecommendation(item.category);
    const basePath = getBasePath();

    if (rec && rec.name !== item.name && recsBlock && recContainer) {
      const imgPath = basePath + rec.image;
      recContainer.innerHTML = `
        <img src="${imgPath}" alt="${rec.name}">
        <div class="rec-item-info">
          <p class="rec-item-name">${rec.name}</p>
          <p class="rec-item-price">${formatKsh(rec.price)}</p>
          <button class="btn-primary btn-add-rec" data-name="${rec.name}" data-price="${rec.price}" data-category="${rec.category}" data-image="${imgPath}" style="padding:4px 8px;font-size:0.8rem;margin-top:5px;">Add to Cart</button>
        </div>
      `;
      recsBlock.style.display = "block";

      const recBtn = recContainer.querySelector(".btn-add-rec");
      if (recBtn) {
        recBtn.addEventListener("click", (e) => {
          e.preventDefault();
          addItemToCart({
            name: rec.name,
            price: rec.price,
            displayPrice: formatKsh(rec.price),
            category: rec.category,
            image: imgPath,
          });
        });
      }
    } else if (recsBlock) {
      recsBlock.style.display = "none";
    }

    modal.classList.add("active");
  }

  /* ── Bind Add-to-Cart Buttons ── */
  function bindAddToCartButtons(container) {
    const scope = container || document;
    scope.querySelectorAll(".btn-add-cart:not([data-cart-bound])").forEach((btn) => {
      btn.setAttribute("data-cart-bound", "true");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (this.disabled) return;

        const item = {
          name: this.dataset.name || "Product",
          price: Number(this.dataset.price) || 0,
          displayPrice: formatKsh(Number(this.dataset.price) || 0),
          category: this.dataset.category || "Products",
          image: this.dataset.image || "",
        };
        addItemToCart(item);
      });
    });
  }

  /* ── Modal Close Buttons ── */
  function bindModalClose() {
    document.querySelectorAll("#cart-modal-close, #cart-modal-continue").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById("cart-modal");
        if (modal) modal.classList.remove("active");
      });
    });

    /* Close on overlay click */
    const modal = document.getElementById("cart-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
      });
    }
  }

  /* ── Init ── */
  function init() {
    updateCartBadge();
    bindAddToCartButtons();
    bindModalClose();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* ── Public API ── */
  window.GrandGestureCart = {
    addItem: addItemToCart,
    getItems: getCartItems,
    saveItems: saveCartItems,
    updateBadge: updateCartBadge,
    formatPrice: formatKsh,
    bindButtons: bindAddToCartButtons,
    getBasePath: getBasePath,
  };
})();
