// app.js

document.addEventListener('DOMContentLoaded', () => {
    // ----- Telegram Web App Sozlamalari -----
    const tg = window.Telegram.WebApp;
    tg.ready(); // Ilova tayyorligini bildirish
    tg.expand(); // Ilovani to'liq ekranga ochish

    // ----- Backend API manzili -----
    const API_URL = './api/order.php';

    // ----- Humo ma'lumotlari (Backenddan olish yaxshiroq, lekin frontendda ham bo'lishi mumkin)
    const HUMO_CARD = '9860 2466 0203 3937';
    const CARD_OWNER = 'Sardor Jorayev';
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
    let selectedPremiumPlan = null; // Tanlangan premium tarifni saqlash uchun

    // ----- Lottie Animatsiyalari -----
    // Sizning fayllaringiz nomini/manzilini qo'ying. Hozircha LottieFiles'dan test animatsiyalar.
    // zip ichidagi .json faylni topib, uni serverga yuklang va yo'lini ko'rsating.
    // Yoki CDN link ishlating.
    
    // Boshlang'ich yuklovchi (1757960351...2.lottie.zip)
    const loaderAnim = lottie.loadAnimation({
        container: document.getElementById('lottie-loader'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        // path: 'path/to/your/loading.json' 
        path: 'https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json' // Placeholder
    });

    // Buyurtma yuklovchi (5 sekundlik)
    const orderLoaderAnim = lottie.loadAnimation({
        container: document.getElementById('lottie-order-loader'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        // path: 'path/to/your/loading.json' // Xuddi o'sha animatsiyani ishlatsa bo'ladi
        path: 'https://assets10.lottiefiles.com/packages/lf20_p8bfn5to.json' // Placeholder
    });
    
    // Pastdagi animatsiya (175796077...2.lottie.zip)
    const footerAnim = lottie.loadAnimation({
        container: document.getElementById('lottie-footer'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        // path: 'path/to/your/footer_stars.json'
        path: 'https://assets2.lottiefiles.com/packages/lf20_obhph31z.json' // Placeholder (Stars)
    });


    // ----- Yordamchi Funksiyalar -----

    /**
     * Kerakli ekranni silliq tarzda ko'rsatadi
     * @param {string} screenId Ko'rsatilishi kerak bo'lgan ekran ID'si
     */
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });
        if (screens[screenId]) {
            screens[screenId].classList.add('active');
        }
    }

    /**
     * Foydalanuvchiga xabar ko'rsatish va ilovani yopish tugmasini taklif qilish
     * @param {string} title Sarlavha
     * @param {string} text Matn
     */
    function showMessage(title, text) {
        display.messageTitle.textContent = title;
        display.messageText.innerHTML = text; // HTMLni qo'llab-quvvatlash uchun
        showScreen('message');
    }

    /**
     * Backendga buyurtmani yuborish
     * @param {object} orderData Buyurtma ma'lumotlari
     */
    async function sendOrderToAdmin(orderData) {
        // 5 sekundlik animatsiyani ko'rsatish
        showScreen('orderLoading');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            // 5 sekund kutish (animatsiya ko'rinishi uchun)
            await new Promise(resolve => setTimeout(resolve, 5000));

            if (result.status === 'success') {
                // Muvaffaqiyatli xabar
                let successMessage = "Buyurtmangiz qabul qilindi. Tez orada admin siz bilan bog'lanadi.";
                
                // Agar Humo tanlangan bo'lsa, karta raqamini ko'rsatish
                if (orderData.payment_method === 'Humo') {
                    let priceText = '';
                    if (orderData.type === 'stars') {
                        const randomSurcharge = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
                        const totalPrice = (orderData.stars_amount * STAR_PRICE_UZS) + randomSurcharge;
                        priceText = `<b>${totalPrice.toLocaleString('uz-UZ')} UZS</b>`;
                    } else if (orderData.type === 'premium') {
                        priceText = `<b>${orderData.price}</b>`;
                    }
                    
                    successMessage = `Buyurtmangiz qabul qilindi. <br><br>Iltimos, ${priceText} miqdoridagi to'lovni quyidagi karta raqamiga o'tkazing va chekni adminga yuboring:<br><br>` +
                                     `<b>Karta:</b> <code>${HUMO_CARD}</code><br>` +
                                     `<b>Qabul qiluvchi:</b> ${CARD_OWNER}`;
                } else if (orderData.payment_method === 'Stars') {
                     const totalStars = orderData.stars_amount + (orderData.stars_amount / 50 * 10);
                     successMessage = `Buyurtmangiz qabul qilindi. <br><br>Iltimos, <b>${totalStars} Stars</b> miqdorini adminga yuboring.` +
                                      `<br><i>(Bu jarayon avtomatlashtiriladi, hozircha qo'lda)</i>`;
                }

                showMessage("✅ Muvaffaqiyatli!", successMessage);
            } else {
                throw new Error(result.message || 'Noma\'lum xatolik');
            }

        } catch (error) {
            // 5 sekund kutish (agar xatolik tez yuz bersa ham)
            await new Promise(resolve => setTimeout(resolve, 5000));
            showMessage("❌ Xatolik!", "Buyurtmani yuborishda xatolik yuz berdi: " + error.message);
        }
    }


    // ----- Voqea Tinglovchilar (Event Listeners) -----

    // 1. Boshlang'ich yuklanishni yashirish (masalan, 2 sekunddan keyin)
    setTimeout(() => {
        showScreen('main');
    }, 1750); // 1.75 sekund

    // 2. Asosiy menyu tugmalari
    buttons.gotoStars.addEventListener('click', () => showScreen('stars'));
    buttons.gotoPremium.addEventListener('click', () => showScreen('premium'));

    // 3. Barcha "Orqaga" tugmalari
    buttons.back.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetScreen = e.target.getAttribute('data-target');
            if (targetScreen) {
                showScreen(targetScreen.replace('screen-', ''));
            }
        });
    });

    // 4. Ilovani yopish tugmasi
    buttons.closeWebapp.addEventListener('click', () => {
        tg.close();
    });

    // ----- STARS OLISH MANTIQI -----

    // To'lov turi o'zgarganda ma'lumotni ko'rsatish
    inputs.starsPayment.addEventListener('change', () => {
        const method = inputs.starsPayment.value;
        const amount = parseInt(inputs.starsAmount.value) || 0;
        let detailsHtml = '';

        if (method === 'Humo') {
            if (amount < 50) {
                detailsHtml = `<p class="error-message">Minimum 50 stars kiriting.</p>`;
            } else {
                // Random qo'shimcha frontendda HISOBLANMAYDI, faqat backendda.
                // Bu yerda taxminiy narxni ko'rsatamiz.
                const approxPrice = (amount * STAR_PRICE_UZS);
                detailsHtml = `<p>Siz to'lashingiz kerak bo'lgan taxminiy summa: <b>~${approxPrice.toLocaleString('uz-UZ')} UZS</b></p>` +
                              `<p><small>(Aniq summa (kichik random qo'shimcha bilan) buyurtma berganingizdan so'ng ko'rsatiladi)</small></p>`;
            }
        } else if (method === 'Stars') {
            if (amount < 50) {
                detailsHtml = `<p class="error-message">Minimum 50 stars kiriting.</p>`;
            } else {
                // Har 50 stars uchun 10 stars (20% qo'shimcha)
                const surcharge = (amount / 50) * 10;
                const totalStars = amount + surcharge;
                detailsHtml = `<p>Siz <b>${amount}</b> stars uchun jami <b>${totalStars} Stars</b> to'lashingiz kerak bo'ladi (<b>${surcharge}</b> stars qo'shimcha).</p>` +
                              `<p><small>Bu to'lov avtomatik tarzda hisobingizdan yechiladi (hozircha test rejimida).</small></p>`;
            }
        }
        display.starsPaymentDetails.innerHTML = detailsHtml;
        display.starsPaymentDetails.classList.toggle('hidden', detailsHtml === '');
    });

    // Stars formasini yuborish
    forms.stars.addEventListener('submit', (e) => {
        e.preventDefault(); // Sahifani yangilamaslik
        
        const username = inputs.username.value.replace('@', ''); // @ belgisini olib tashlash
        const starsAmount = parseInt(inputs.starsAmount.value);
        const paymentMethod = inputs.starsPayment.value;

        if (!username || !starsAmount || !paymentMethod) {
            tg.HapticFeedback.notificationOccurred('error');
            alert("Barcha maydonlarni to'ldiring!");
            return;
        }

        if (starsAmount < 50) {
            tg.HapticFeedback.notificationOccurred('error');
            alert("Minimum 50 stars kiriting!");
            return;
        }

        // Ma'lumotlarni yig'ish va backendga yuborish
        const orderData = {
            type: 'stars',
            username: username,
            stars_amount: starsAmount,
            payment_method: paymentMethod,
        };

        sendOrderToAdmin(orderData);
    });


    // ----- PREMIUM OLISH MANTIQI -----

    // Premium tarifini tanlash
    premiumOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Avval barchasidan 'selected' klassini olib tashlash
            premiumOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Bosilganiga 'selected' klassini qo'shish
            option.classList.add('selected');
            
            // Ma'lumotlarni saqlash
            selectedPremiumPlan = {
                plan: option.getAttribute('data-plan'),
                price: option.getAttribute('data-price-uzs'),
                price_formatted: option.querySelector('p').textContent
            };

            // To'lov bo'limini ko'rsatish
            display.premiumPaymentSection.classList.remove('hidden');
            
            // To'lov turini qayta tanlashni majburlash
            inputs.premiumPayment.value = ""; 
            display.premiumPaymentDetails.classList.add('hidden');
            buttons.submitPremium.classList.add('hidden');

            tg.HapticFeedback.impactOccurred('light');
        });
    });

    // Premium uchun to'lov turi o'zgarganda
    inputs.premiumPayment.addEventListener('change', () => {
        const method = inputs.premiumPayment.value;
        let detailsHtml = '';
        let canSubmit = false;

        if (method === 'Humo') {
            detailsHtml = `<p>To'lov uchun summa: <b>${selectedPremiumPlan.price_formatted}</b></p>` +
                          `<p><small>Buyurtmani tasdiqlaganingizdan so'ng to'lov kartasi ko'rsatiladi.</small></p>`;
            canSubmit = true;
        } else if (method === 'Stars') {
            detailsHtml = `<p class="error-message">Afsuski, Stars orqali premium olish imkonsiz!</p>`;
            canSubmit = false;
        }

        display.premiumPaymentDetails.innerHTML = detailsHtml;
        display.premiumPaymentDetails.classList.remove('hidden');
        buttons.submitPremium.classList.toggle('hidden', !canSubmit);
    });
    
    // Premium buyurtmasini yuborish
    buttons.submitPremium.addEventListener('click', () => {
        if (!selectedPremiumPlan) {
            tg.HapticFeedback.notificationOccurred('error');
            alert("Iltimos, avval tarifni tanlang.");
            return;
        }
        
        const paymentMethod = inputs.premiumPayment.value;
        
        if (paymentMethod !== 'Humo') {
             tg.HapticFeedback.notificationOccurred('error');
             alert("Faqat Humo orqali to'lov mumkin.");
             return;
        }
        
        // Ma'lumotlarni yig'ish va backendga yuborish
        const orderData = {
            type: 'premium',
            plan: selectedPremiumPlan.plan,
            price: selectedPremiumPlan.price_formatted,
            payment_method: paymentMethod,
        };
        
        sendOrderToAdmin(orderData);
    });

});
