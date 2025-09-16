document.addEventListener('DOMContentLoaded', () => {
    // --- Telegram Web Appni ishga tushirish ---
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Ilovani to'liq ekranga ochish

    // --- Sahifa (Page) elementlari ---
    const pages = document.querySelectorAll('.page');
    const loadingScreen = document.getElementById('loading-screen');
    const transitionLoader = document.getElementById('transition-loader');
    const mainMenu = document.getElementById('main-menu');
    const starsPage = document.getElementById('stars-page');
    const premiumPage = document.getElementById('premium-page');
    const humoPaymentPage = document.getElementById('humo-payment-page');

    // --- Asosiy menyu tugmalari ---
    const btnGoToStars = document.getElementById('btn-goto-stars');
    const btnGoToPremium = document.getElementById('btn-goto-premium');
    
    // --- Barcha "Orqaga" tugmalari ---
    const backBtns = document.querySelectorAll('.back-btn');

    // --- Stars Olish elementlari ---
    const usernameInput = document.getElementById('username');
    const starsAmountInput = document.getElementById('stars-amount');
    const starsPaymentType = document.getElementById('stars-payment-type');
    const starsInfoBox = document.getElementById('stars-info');
    const submitStarsBtn = document.getElementById('submit-stars-order');

    // --- Premium Olish elementlari ---
    const premiumOptions = document.querySelectorAll('.premium-option');
    const premiumPaymentSection = document.getElementById('premium-payment-section');
    const premiumPaymentType = document.getElementById('premium-payment-type');
    const premiumInfoBox = document.getElementById('premium-info');
    
    // --- Humo To'lov elementlari ---
    const paymentAmountDisplay = document.getElementById('payment-amount-display');
    const btnPaymentDone = document.getElementById('btn-payment-done');

    // --- O'zgaruvchilar ---
    const STAR_PRICE_UZS = 220; // 1 yulduz narxi (shartli)
    const ADMIN_HUMO_CARD = '9860 2466 0203 3937';
    const ADMIN_HUMO_NAME = 'Sardor Jorayev';
    
    let currentOrderData = {}; // Joriy buyurtma ma'lumotlarini saqlash uchun
    let previousPageId = 'main-menu'; // Orqaga qaytish uchun
    let selectedPremiumPlan = null; // Tanlangan premium reja

    // --- Funksiyalar ---

    /** Sahifalarni almashtirish funksiyasi */
    function showPage(pageId) {
        // Hozirgi aktiv sahifani yashirish
        const currentPage = document.querySelector('.page.active');
        if (currentPage) {
            currentPage.classList.remove('active');
        }
        
        // Yangi sahifani ko'rsatish
        const newPage = document.getElementById(pageId);
        if (newPage) {
            newPage.classList.add('active');
        }
    }

    /** Xabar qutisini ko'rsatish */
    function showInfo(element, message, type = 'success') {
        element.innerHTML = message;
        element.className = 'info-box'; // Avvalgi klasslarni tozalash
        element.classList.add(type); // 'success' yoki 'error'
        element.style.display = 'block';
    }

    /** Tasodifiy to'lov miqdorini generatsiya qilish */
    function generateRandomAmount(baseAmount) {
        // Masalan, 100 dan 999 gacha tasodifiy son qo'shamiz
        const randomAddon = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
        return baseAmount + randomAddon;
    }
    
    /** Stars uchun to'lov miqdorini hisoblash */
    function calculateStarsFee(amount) {
        // Har 50 uchun 10 qo'shiladi (ya'ni +20%)
        return Math.ceil(amount * 1.2);
    }
    
    /** Ma'lumotlarni Botga (Backendga) yuborish */
    function sendDataToBot(data) {
        tg.sendData(JSON.stringify(data));
        // Muvaffaqiyatli yuborilgandan so'ng xabar berish
        tg.HapticFeedback.notificationOccurred('success');
        alert("Buyurtmangiz adminga yuborildi. Tez orada ko'rib chiqiladi.");
        // Asosiy menyuga qaytish
        showPage('main-menu');
        resetStarsForm();
        resetPremiumForm();
    }
    
    // --- Sahifalarni boshqarish ---

    // 1. Boshlang'ich yuklanish
    setTimeout(() => {
        showPage('main-menu');
    }, 3000); // 3 sekund kutish (animatsiya uchun)

    // 2. Stars olishga o'tish (5 sekundlik yuklanish bilan)
    btnGoToStars.addEventListener('click', () => {
        previousPageId = 'main-menu';
        transitionLoader.classList.add('active'); // Yuklanishni ko'rsatish
        
        setTimeout(() => {
            transitionLoader.classList.remove('active'); // Yuklanishni yashirish
            showPage('stars-page');
        }, 5000); // Talab qilingan 5 sekund
    });

    // 3. Premium olishga o'tish
    btnGoToPremium.addEventListener('click', () => {
        previousPageId = 'main-menu';
        showPage('premium-page');
    });

    // 4. "Orqaga" tugmalarini boshqarish
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            let target = btn.dataset.target;
            if (target === 'previous') {
                showPage(previousPageId);
            } else {
                showPage(target);
            }
        });
    });

    // --- Stars Olish Mantiqi ---

    function validateStarsForm() {
        const amount = parseInt(starsAmountInput.value, 10);
        const username = usernameInput.value;
        const paymentType = starsPaymentType.value;
        
        let isValid = true;
        
        if (!username.startsWith('@') || username.length < 3) {
            showInfo(starsInfoBox, "Username '@' bilan boshlanishi va kamida 3 belgidan iborat bo'lishi kerak.", 'error');
            isValid = false;
        } else if (isNaN(amount) || amount < 50) {
            showInfo(starsInfoBox, "Stars miqdori kamida 50 bo'lishi kerak.", 'error');
            isValid = false;
        } else if (paymentType === "") {
            showInfo(starsInfoBox, "Iltimos, to'lov turini tanlang.", 'error');
            isValid = false;
        }

        if (isValid) {
            if (paymentType === 'stars') {
                const totalStars = calculateStarsFee(amount);
                showInfo(starsInfoBox, `Siz ${amount} stars olmoqchisiz. Buning uchun hisobingizdan <strong>${totalStars} stars</strong> yechiladi.`, 'success');
            } else if (paymentType === 'humo') {
                const totalUzs = STAR_PRICE_UZS * amount;
                showInfo(starsInfoBox, `To'lov miqdori: <strong>~${totalUzs.toLocaleString()} UZS</strong>. (Aniq summa keyingi qadamda ko'rsatiladi)`, 'success');
            }
            submitStarsBtn.disabled = false;
        } else {
            submitStarsBtn.disabled = true;
        }
    }
    
    starsAmountInput.addEventListener('input', validateStarsForm);
    usernameInput.addEventListener('input', validateStarsForm);
    starsPaymentType.addEventListener('change', validateStarsForm);

    submitStarsBtn.addEventListener('click', () => {
        const amount = parseInt(starsAmountInput.value, 10);
        const username = usernameInput.value;
        const paymentType = starsPaymentType.value;
        
        currentOrderData = {
            type: 'stars_order',
            username: username,
            amount: amount,
            paymentType: paymentType
        };

        if (paymentType === 'stars') {
            // "stars.zip" kodi bu yerda ishlaydi
            // Bu kod to'lovni avtomatik amalga oshirishi kerak
            // Shartli ravishda bu funksiyani chaqiramiz:
            // sendTelegramStarsPayment(calculateStarsFee(amount)); 
            
            // Bu yerda biz shunchaki botga xabar yuboramiz
            currentOrderData.totalStarsFee = calculateStarsFee(amount);
            sendDataToBot(currentOrderData);
            
        } else if (paymentType === 'humo') {
            const baseAmount = amount * STAR_PRICE_UZS;
            const finalAmount = generateRandomAmount(baseAmount);
            currentOrderData.totalUzs = finalAmount;
            
            // To'lov oynasini tayyorlash
            paymentAmountDisplay.textContent = `${finalAmount.toLocaleString()} UZS`;
            document.getElementById('humo-card').textContent = ADMIN_HUMO_CARD;
            document.getElementById('humo-name').textContent = ADMIN_HUMO_NAME;
            
            previousPageId = 'stars-page';
            showPage('humo-payment-page');
        }
    });
    
    function resetStarsForm() {
        usernameInput.value = '';
        starsAmountInput.value = '';
        starsPaymentType.value = '';
        starsInfoBox.style.display = 'none';
        submitStarsBtn.disabled = true;
    }

    // --- Premium Olish Mantiqi ---

    premiumOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Avvalgi tanlovni olib tashlash
            premiumOptions.forEach(opt => opt.classList.remove('selected'));
            // Yangisini tanlash
            option.classList.add('selected');
            
            selectedPremiumPlan = {
                plan: option.dataset.plan,
                price: parseInt(option.dataset.price, 10)
            };
            
            premiumPaymentSection.classList.remove('hidden');
            validatePremiumPayment();
        });
    });

    premiumPaymentType.addEventListener('change', validatePremiumPayment);

    function validatePremiumPayment() {
        const paymentType = premiumPaymentType.value;
        
        if (!selectedPremiumPlan) return;

        if (paymentType === 'stars') {
            showInfo(premiumInfoBox, "Kechirasiz, Stars orqali premium olish imkonsiz!", 'error');
        } else if (paymentType === 'humo') {
            const price = selectedPremiumPlan.price;
            showInfo(premiumInfoBox, `Tanlangan reja: ${selectedPremiumPlan.plan} oylik. <br> To'lov miqdori: <strong>~${price.toLocaleString()} UZS</strong>.`, 'success');
            
            // To'lovga o'tish tugmasini qo'shish (ixtiyoriy) yoki shu yerda funksiyani davom ettirish
            // Hozir biz Humo oynasiga o'tkazamiz
            
            const finalAmount = generateRandomAmount(price);
            currentOrderData = {
                type: 'premium_order',
                plan: selectedPremiumPlan.plan,
                basePrice: selectedPremiumPlan.price,
                totalUzs: finalAmount,
                paymentType: 'humo'
            };

            // To'lov oynasini tayyorlash
            paymentAmountDisplay.textContent = `${finalAmount.toLocaleString()} UZS`;
            document.getElementById('humo-card').textContent = ADMIN_HUMO_CARD;
            document.getElementById('humo-name').textContent = ADMIN_HUMO_NAME;
            
            previousPageId = 'premium-page';
            showPage('humo-payment-page');
            
        } else {
            premiumInfoBox.style.display = 'none';
        }
    }
    
    function resetPremiumForm() {
        premiumOptions.forEach(opt => opt.classList.remove('selected'));
        premiumPaymentSection.classList.add('hidden');
        premiumPaymentType.value = '';
        premiumInfoBox.style.display = 'none';
        selectedPremiumPlan = null;
    }

    // --- "To'lov qildim" tugmasi ---
    btnPaymentDone.addEventListener('click', () => {
        // `currentOrderData` allaqachon to'ldirilgan (stars yoki premiumdan)
        sendDataToBot(currentOrderData);
    });
});
