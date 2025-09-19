// Barcha kod `DOMContentLoaded` ichida bo'lishi kerak.
// Bu degani, HTML to'liq yuklanib bo'lgandan keyingina JS ishga tushadi.
document.addEventListener('DOMContentLoaded', () => {
    // ----- Telegram Web App Sozlamalari -----
    const tg = window.Telegram.WebApp;
    tg.ready(); 
    tg.expand();
    // Ilovaga mos ranglarni o'rnatish
    tg.setHeaderColor('#0a0a0a');
    tg.setBackgroundColor('#0a0a0a');

    // ----- Backend API manzili -----
    const API_URL = './api/order.php';

    // ----- Sozlamalar (Admin o'zgartirishi kerak) -----
    const HUMO_CARD = '9860 1111 2222 3333'; // O'zingiznikiga almashtiring
    const CARD_OWNER = 'ADMIN ISMI'; // O'zingiznikiga almashtiring
    const STAR_PRICE_UZS = 220; // 1 stars narxi

    // ----- Barcha Ekranlar va Elementlar -----
    const screens = {
        loading: document.getElementById('screen-loading'),
        main: document.getElementById('screen-main'),
        stars: document.getElementById('screen-stars'),
        premium: document.getElementById('screen-premium'),
        orderLoading: document.getElementById('screen-order-loading'),
        message: document.getElementById('screen-message'),
    };

    const buttons = {
        gotoStars: document.getElementById('btn-goto-stars'),
        gotoPremium: document.getElementById('btn-goto-premium'),
        back: document.querySelectorAll('.back-button'),
        submitPremium: document.getElementById('btn-submit-premium'),
        closeWebapp: document.getElementById('btn-close-webapp'),
    };

    const forms = {
        stars: document.getElementById('stars-form'),
    };

    const inputs = {
        username: document.getElementById('username'),
        starsAmount: document.getElementById('stars_amount'),
        starsPayment: document.getElementById('stars_payment'),
        premiumPayment: document.getElementById('premium_payment'),
    };

    const display = {
        starsPaymentDetails: document.getElementById('stars-payment-details'),
        premiumPaymentSection: document.getElementById('premium-payment-section'),
        premiumPaymentDetails: document.getElementById('premium-payment-details'),
        messageTitle: document.getElementById('message-title'),
        messageText: document.getElementById('message-text'),
    };

    const premiumOptions = document.querySelectorAll('.premium-option');
    let selectedPremiumPlan = null;

    // ----- Lottie Animatsiyalari -----
    try {
        lottie.loadAnimation({
            container: document.getElementById('lottie-loader'),
            renderer: 'svg', loop: true, autoplay: true,
            path: 'https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json'
        });
        lottie.loadAnimation({
            container: document.getElementById('lottie-order-loader'),
            renderer: 'svg', loop: true, autoplay: true,
            path: 'https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json'
        });
        lottie.loadAnimation({
            container: document.getElementById('lottie-footer'),
            renderer: 'svg', loop: true, autoplay: true,
            path: 'https://assets2.lottiefiles.com/packages/lf20_obhph31z.json'
        });
    } catch(e) { console.error("Lottie animatsiyasini yuklashda xatolik:", e); }

    // ----- Yordamchi Funksiyalar -----
    function showScreen(screenId) {
        Object.keys(screens).forEach(key => screens[key].classList.remove('active'));
        if (screens[screenId]) screens[screenId].classList.add('active');
    }

    function showMessage(title, text) {
        display.messageTitle.textContent = title;
        display.messageText.innerHTML = text;
        showScreen('message');
    }

    async function sendOrderToAdmin(orderData) {
        showScreen('orderLoading');
        try {
            const userData = tg.initDataUnsafe?.user || {};
            orderData.user_info = {
                id: userData.id,
                first_name: userData.first_name,
                username: userData.username,
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                let successMessage = `Buyurtmangiz qabul qilindi. Tez orada admin siz bilan bog'lanadi.`;
                if (orderData.payment_method === 'Humo') {
                    let priceText = result.total_price_uzs ? `<b>${result.total_price_uzs.toLocaleString('uz-UZ')} UZS</b>` : `<b>${orderData.price}</b>`;
                    successMessage = `Buyurtmangiz qabul qilindi. <br><br>Iltimos, ${priceText} miqdorini quyidagi kartaga o'tkazing va chekni adminga yuboring:<br><br>` +
                                     `<div style="text-align:left; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px;"><b>Karta:</b> <code>${HUMO_CARD}</code><br>` +
                                     `<b>Qabul qiluvchi:</b> ${CARD_OWNER}</div>`;
                } else if (orderData.payment_method === 'Stars' && result.total_stars) {
                     successMessage = `Buyurtmangiz qabul qilindi. <br><br>Iltimos, <b>${result.total_stars} Stars</b> miqdorini adminga yuboring.`;
                }
                showMessage("✅ Muvaffaqiyatli!", successMessage);
            } else {
                throw new Error(result.message || 'Noma\'lum xatolik');
            }
        } catch (error) {
            console.error("Buyurtma yuborishda xato:", error);
            showMessage("❌ Xatolik!", "Server bilan bog'lanishda xatolik yuz berdi. Iltimos, keyinroq qayta urunib ko'ring.");
        }
    }

    // ----- Voqea Tinglovchilar (Event Listeners) -----
    
    // Bosh menyu tugmalari
    buttons.gotoStars.addEventListener('click', () => showScreen('stars'));
    buttons.gotoPremium.addEventListener('click', () => showScreen('premium'));

    // "Orqaga" tugmalari
    buttons.back.forEach(button => {
        button.addEventListener('click', (e) => showScreen(e.currentTarget.dataset.target.replace('screen-', '')));
    });

    // Ilovani yopish
    buttons.closeWebapp.addEventListener('click', () => tg.close());

    // Stars formasi logikasi
    inputs.starsPayment.addEventListener('change', () => {
        const method = inputs.starsPayment.value;
        const amount = parseInt(inputs.starsAmount.value) || 0;
        let detailsHtml = '';

        if (amount < 50) detailsHtml = `<p style="color:#f87171;">Minimum 50 stars kiriting.</p>`;
        else if (method === 'Humo') detailsHtml = `<p>Taxminiy summa: <b>~${(amount * STAR_PRICE_UZS).toLocaleString('uz-UZ')} UZS</b></p>`;
        else if (method === 'Stars') detailsHtml = `<p>Jami <b>${amount + Math.ceil(amount / 50) * 10} Stars</b> to'lashingiz kerak.</p>`;
        
        display.starsPaymentDetails.innerHTML = detailsHtml;
        display.starsPaymentDetails.classList.toggle('hidden', detailsHtml === '');
    });

    forms.stars.addEventListener('submit', (e) => {
        e.preventDefault();
        if (inputs.starsAmount.value < 50) return alert("Minimum 50 stars kiriting!");
        sendOrderToAdmin({
            type: 'stars',
            username: inputs.username.value.replace('@', ''),
            stars_amount: parseInt(inputs.starsAmount.value),
            payment_method: inputs.starsPayment.value,
        });
    });

    // Premium formasi logikasi
    premiumOptions.forEach(option => {
        option.addEventListener('click', () => {
            premiumOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedPremiumPlan = {
                plan: option.dataset.plan,
                price: option.dataset.priceUzs,
                price_formatted: option.querySelector('p').textContent
            };
            display.premiumPaymentSection.classList.remove('hidden');
            inputs.premiumPayment.value = ""; 
            display.premiumPaymentDetails.classList.add('hidden');
            buttons.submitPremium.classList.add('hidden');
        });
    });

    inputs.premiumPayment.addEventListener('change', () => {
        const method = inputs.premiumPayment.value;
        let canSubmit = method === 'Humo';
        display.premiumPaymentDetails.innerHTML = canSubmit ? `<p>To'lov uchun summa: <b>${selectedPremiumPlan.price_formatted}</b></p>` : `<p style="color:#f87171;">Premium uchun Stars orqali to'lov imkonsiz.</p>`;
        display.premiumPaymentDetails.classList.remove('hidden');
        buttons.submitPremium.classList.toggle('hidden', !canSubmit);
    });
    
    buttons.submitPremium.addEventListener('click', () => {
        sendOrderToAdmin({
            type: 'premium',
            plan: selectedPremiumPlan.plan,
            price: selectedPremiumPlan.price_formatted,
            payment_method: inputs.premiumPayment.value,
        });
    });

    // ----- Ilovani ishga tushirish -----
    setTimeout(() => showScreen('main'), 2000); // 2 sekunddan so'ng asosiy ekranni ko'rsatish
});
