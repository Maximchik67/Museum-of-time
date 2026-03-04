import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import { auth, db } from './firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendEmailVerification,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, deleteDoc, where } from 'firebase/firestore';

// 1. ДАНІ ЕКСКУРСІЙ ТА НАЛАШТУВАННЯ АДМІНА
const ADMIN_EMAIL = 'v2srjoy@gmail.com';

const mockGuides = [
  { 
    id: 1, 
    name: "Професор Віктор", 
    era: "Стародавній світ", 
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80", 
    bio: "Знає всі таємниці фараонів та де сховані найкращі артефакти Стародавнього Єгипту." 
  },
  { 
    id: 2, 
    name: "Мадам Олена", 
    era: "Епоха Відродження", 
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80", 
    bio: "Особисто пила чай з да Вінчі. Розповість про кожен мазок на відомих картинах та секрети алхіміків." 
  },
  { 
    id: 3, 
    name: "Кібер-Алекс", 
    era: "Майбутнє", 
    photo: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=500&q=80", 
    bio: "Мандрівник у часі з 2077 року. Покаже вам неонове майбутнє та навчить користуватися імплантами." 
  }
];
// СТОРІНКА ЕКСКУРСОВОДІВ (ГІДІВ)
function GuidesPage({ user }) {
  const isSuperUser = user && user.email === ADMIN_EMAIL; 

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuide, setNewGuide] = useState({ name: '', era: '', description: '', imageUrl: '' });
  
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', era: '', description: '', imageUrl: '' });

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "guides"));
        const guidesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGuides(guidesData);
      } catch (error) {
        console.error("Помилка при завантаженні гідів:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  // ФУНКЦІЯ ШВИДКОГО ЗАВАНТАЖЕННЯ (Щоб не вводити вручну)
  const handleSeedGuides = async () => {
    try {
      // mockGuides - це масив гідів, який у тебе є на початку файлу
      for (const guide of mockGuides) {
        // Записуємо зі старими даними (там було photo, а ми переназвемо на imageUrl для зручності)
        const guideToSave = {
          name: guide.name,
          era: guide.era,
          description: guide.bio,
          imageUrl: guide.photo
        };
        await setDoc(doc(db, "guides", String(guide.id)), guideToSave);
      }
      
      const querySnapshot = await getDocs(collection(db, "guides"));
      const guidesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGuides(guidesData);
      
      alert("Тестових провідників успішно завантажено в Firebase! 🎉");
    } catch (error) {
      alert("Помилка: " + error.message);
    }
  };

  const handleAddGuide = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "guides"), newGuide);
      setGuides([...guides, { id: docRef.id, ...newGuide }]);
      setShowAddModal(false);
      setNewGuide({ name: '', era: '', description: '', imageUrl: '' });
      alert("Гіда успішно додано! ✅");
    } catch (error) {
      alert("Помилка при додаванні: " + error.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const guideRef = doc(db, "guides", String(editId)); 
      await updateDoc(guideRef, editData);
      setGuides(guides.map(g => g.id === editId ? { id: editId, ...editData } : g));
      setEditId(null);
    } catch (error) {
      alert("Помилка при збереженні: " + error.message);
    }
  };

  const handleDeleteGuide = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm("Ви дійсно хочете назавжди звільнити цього гіда? 🗑️")) {
      try {
        await deleteDoc(doc(db, "guides", String(id)));
        setGuides(guides.filter(g => g.id !== id));
      } catch (error) {
        alert("Помилка при видаленні: " + error.message);
      }
    }
  };

  if (loading) {
    return <h2 style={{textAlign: 'center', marginTop: '100px', color: 'var(--accent-gold)'}}>Завантаження провідників... ⏳</h2>;
  }

  return (
    <div className="guides-page" style={{ padding: '40px 20px', marginTop: '60px', maxWidth: '1200px', margin: '60px auto 0' }}>
      <h2 style={{ textAlign: 'center', fontSize: '42px', marginBottom: '10px' }}>Наші Провідники в Часі</h2>
      <p style={{ textAlign: 'center', fontSize: '18px', color: '#ccc', marginBottom: '40px' }}>Вони знають про минуле та майбутнє більше, ніж Вікіпедія</p>

      {isSuperUser && (
        <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>➕ Додати гіда</button>
        </div>
      )}

      {guides.length === 0 && (
        <div style={{ textAlign: 'center', color: '#ff9800', marginBottom: '20px' }}>
          <p style={{ marginBottom: '15px' }}>Схоже, всі гіди розбіглися по різних епохах. База порожня!</p>
          {isSuperUser && (
            <button onClick={handleSeedGuides} style={{ padding: '10px 20px', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
              📥 Завантажити 3 тестових гідів у Firebase
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {guides.map(guide => (
          <div key={guide.id} style={{ background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid #333' }}>
            
            {isSuperUser && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                <button onClick={(e) => { e.stopPropagation(); setEditId(guide.id); setEditData({ name: guide.name, era: guide.era, description: guide.description, imageUrl: guide.imageUrl }); }} style={{ padding: '6px 10px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }} title="Редагувати">⚙️</button>
                <button onClick={(e) => handleDeleteGuide(guide.id, e)} style={{ padding: '6px 10px', background: '#f44336', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }} title="Видалити">🗑️</button>
              </div>
            )}

            <img src={guide.imageUrl} alt={guide.name} style={{ width: '100%', height: '350px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://dummyimage.com/600x800/1a1a1a/c5a059.png&text=NO+PHOTO'; }} />
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', color: 'var(--accent-gold)' }}>{guide.name}</h3>
              <div style={{ color: '#e6a15c', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>{guide.era}</div>
              <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.5', margin: 0 }}>{guide.description}</p>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div style={{ padding: '35px', width: '90%', maxWidth: '600px', background: '#151515', border: '1px solid #4CAF50', borderRadius: '12px' }}>
            <h3 style={{ color: '#4CAF50', marginTop: '0', marginBottom: '25px', textAlign: 'center' }}>➕ Новий провідник</h3>
            <form onSubmit={handleAddGuide} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Ім'я (напр. Кібер-Алекс)" required value={newGuide.name} onChange={(e) => setNewGuide({...newGuide, name: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="Епоха (напр. МАЙБУТНЄ)" required value={newGuide.era} onChange={(e) => setNewGuide({...newGuide, era: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <textarea placeholder="Опис навичок" required value={newGuide.description} onChange={(e) => setNewGuide({...newGuide, description: e.target.value})} rows="4" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="URL фотографії" required value={newGuide.imageUrl} onChange={(e) => setNewGuide({...newGuide, imageUrl: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', color: '#ccc', padding: '12px', flex: 1, border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}>Скасувати</button>
                <button type="submit" style={{ background: '#4CAF50', color: '#fff', padding: '12px', flex: 1, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Додати</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editId && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div style={{ padding: '35px', width: '90%', maxWidth: '600px', background: '#151515', border: '1px solid var(--accent-gold)', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginTop: '0', marginBottom: '25px', textAlign: 'center' }}>✏️ Редагувати досьє</h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Ім'я" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="Епоха" value={editData.era} onChange={(e) => setEditData({...editData, era: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <textarea placeholder="Опис" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} rows="4" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="URL фотографії" value={editData.imageUrl} onChange={(e) => setEditData({...editData, imageUrl: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditId(null)} style={{ background: 'transparent', color: '#ccc', padding: '12px', flex: 1, border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}>Скасувати</button>
                <button type="submit" style={{ background: 'var(--accent-gold)', color: '#111', padding: '12px', flex: 1, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const mockExcursions = [
  { 
    id: 1, 
    title: 'Таємниці Стародавнього Єгипту', 
    description: 'Відчуйте подих вічності серед розпечених пісків. Ця екскурсія перенесе вас у часи, коли боги ходили по землі.', 
    price: '350 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [
      { author: 'Олена', text: 'Мурашки по шкірі від залу з муміями. Екскурсовод розповідав такі речі, від яких холоне кров!', rating: '⭐⭐⭐⭐⭐' }
    ] 
  },
  { 
    id: 2, 
    title: 'Епоха Відродження: Коди та Ілюзії', 
    description: 'Пориньте у світ, де геніальність межує з божевіллям. За досконалими мазками пензля да Вінчі та Мікеланджело приховані таємні послання.', 
    price: '400 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 3, 
    title: 'Алхімія та Магія Середньовіччя', 
    description: 'Крізь густий туман часу ми проведемо вас у таємні лабораторії середньовічних алхіміків. Пошуки філософського каменю та заборонені грімуари.', 
    price: '300 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 4, 
    title: 'Загублена Атлантида', 
    description: 'Міф чи реальність? Спустіться в безодню часів до величного міста, яке назавжди поглинув океан. Ми відтворили залишки кристалічних веж.', 
    price: '450 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 5, 
    title: 'Вікторіанський Лондон: Тіні в Тумані', 
    description: 'Лондон кінця XIX століття. Тьмяне світло газових ліхтарів ледь пробивається крізь смог. Епоха джентльменів та нерозкритих злочинів.', 
    price: '350 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 6, 
    title: 'Сингулярність: Подорож у 3024 рік', 
    description: 'Зробіть крок за межі відомого. Майбутнє, де людська свідомість злилася з кібернетичними потоками. Неонове сяйво спустошених мегаполісів.', 
    price: '500 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 7, 
    title: 'Парк Юрського періоду: Живі гіганти', 
    description: 'Поверніться на 150 мільйонів років назад. Відчуйте тремтіння землі від кроків тиранозавра та побачте величних бронтозаврів у їхньому природному середовищі.', 
    price: '450 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1518933165971-611fac3321db?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 8, 
    title: 'Київська Русь: Золоті Ворота', 
    description: 'Пройдіться гамірними вулицями стародавнього Києва часів Ярослава Мудрого. Відвідайте торжище, поспілкуйтеся з ремісниками та побачте княжу дружину.', 
    price: '300 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1589712079088-71e86ba014b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 9, 
    title: 'Епоха Вікінгів: Шлях до Вальгалли', 
    description: 'Суворі фіорди, дзвін мечів та вітрила драккарів. Приєднайтеся до морського походу справжніх скандинавських воїнів та дізнайтеся про їхніх богів.', 
    price: '350 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1598282361136-2244bb587e67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 10, 
    title: 'Гладіатори: Арена Колізею', 
    description: 'Рим, 80 рік нашої ери. Ви на трибунах найвеличнішого амфітеатру у світі. Відчуйте шалену енергетику натовпу, який вирішує долю переможених.', 
    price: '400 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 11, 
    title: 'Золотий вік піратства: Тортуга', 
    description: 'Ром, порох і піастри! Ласкаво просимо до піратської гавані XVII століття. Дізнайтеся таємниці Чорної Бороди та відшукайте захований скарб.', 
    price: '380 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 12, 
    title: 'Самураї: Епоха Едо', 
    description: 'Спокій квітучої сакури та холод смертоносної катани. Зануртеся у філософію японських воїнів, відвідайте чайну церемонію та тренування ніндзя.', 
    price: '420 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 13, 
    title: 'Дикий Захід: Опівдні у Техасі', 
    description: 'Запилені вулиці, салуни з живим піаніно та дуелі на револьверах. Станьте свідком пограбування поїзда або допоможіть шерифу спіймати бандитів.', 
    price: '350 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1525048564243-787131750519?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 14, 
    title: 'Імперія Інків: Таємниця Мачу-Пікчу', 
    description: 'Підніміться високо в Анди до загубленого міста. Дослідіть стародавні обсерваторії, золоті храми та дізнайтеся причину зникнення великої цивілізації.', 
    price: '390 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 15, 
    title: 'Мафія Чикаго 1930-х: Сухий закон', 
    description: 'Підпільні казино, джаз-клуби та перестрілки на вулицях. Одягайте костюм у смужку і дізнайтеся, як Аль Капоне побудував свою імперію.', 
    price: '450 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1512595908076-2f31b0de23ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 16, 
    title: 'Французька революція: Взяття Бастилії', 
    description: 'Париж, 1789 рік. Станьте свідком народження нової республіки та падіння абсолютної монархії.', 
    price: '370 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 17, 
    title: 'Стародавня Греція: Міфи Олімпу', 
    description: 'Відвідайте Афіни часів Перикла, послухайте філософів та дізнайтеся секрети олімпійських богів.', 
    price: '350 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 18, 
    title: 'Епоха Просвітництва: Бал у Версалі', 
    description: 'Одягніть найкраще вбрання і пориньте у розкіш та інтриги королівського двору Людовика XIV.', 
    price: '480 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1543330614-25785aee4bf8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 19, 
    title: 'Льодовиковий період: Полювання на мамонта', 
    description: 'Виживання у найсуворіших умовах. Навчіться розводити вогонь та приєднайтесь до племені кроманьйонців.', 
    price: '300 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 20, 
    title: 'Ренесанс: Канали Венеції', 
    description: 'Карнавальні маски, гондоли та таємні змови. Дослідіть Венеціанську республіку на піку її могутності.', 
    price: '420 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 21, 
    title: 'Космічні перегони: Місія Аполлон-11', 
    description: 'Х\'юстон, у нас немає проблем. Переживіть історичний момент першого кроку людини на Місяць.', 
    price: '500 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 22, 
    title: 'Холодна війна: Шпигунські ігри', 
    description: 'Розділений Берлін 1960-х. Відчуйте себе агентом під прикриттям, якому потрібно передати секретні креслення.', 
    price: '380 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 23, 
    title: 'Розквіт імперії Майя: Чичен-Іца', 
    description: 'Астрономія, жертвоприношення та піраміди, що ховаються в джунглях. Відкрийте мудрість стародавніх.', 
    price: '360 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1518182170546-076616fdfaaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 24, 
    title: 'Ревучі двадцяті: Великий Гетсбі', 
    description: 'Блиск, джаз і шалені вечірки. Зануртеся в атмосферу Нью-Йорка епохи економічного буму.', 
    price: '400 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1504609774528-790186105c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  },
  { 
    id: 25, 
    title: 'Нео-Токіо 2150: Кібернетичний світанок', 
    description: 'Літаючі авто, неонова реклама та андроїди. Як виглядатиме мегаполіс через сотню років?', 
    price: '550 грн', 
    imageUrl: 'https://images.unsplash.com/photo-1554516829-d3fb668128eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
    reviews: [] 
  }
];

// 2. ГОЛОВНА СТОРІНКА (Home Page)
function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="home-page-container">
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Подорожуйте крізь епохи</h1>
          <p className="hero-subtitle">
            Museum of Time — це не просто музей. Це портал у минуле та майбутнє. 
            Відчуйте атмосферу Стародавнього Єгипту, зазирніть у кіберпанк-майбутнє або розгадайте таємниці да Вінчі.
          </p>
          <button className="cta-btn" onClick={() => navigate('/excursions')}>
            Обрати екскурсію
          </button>
        </div>
      </section>

      <section className="about-section">
        <h2>Про наш музей</h2>
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">🕰️</div>
            <h3>Унікальний досвід</h3>
            <p>Ми використовуємо передові технології голограм та повного занурення.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🌍</div>
            <h3>25 часових зон</h3>
            <p>Від античності до далекого майбутнього. Наш каталог постійно поповнюється.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🎭</div>
            <h3>Живі актори</h3>
            <p>Наші екскурсоводи — це не просто гіди, а справжні жителі своїх епох.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// 3. СТОРІНКА ЕКСКУРСІЙ (ТА АДМІНКА)
function ExcursionsPage({ user }) {
  const isSuperUser = user && user.email === ADMIN_EMAIL;

  const [excursions, setExcursions] = useState([]);
  const [guidesList, setGuidesList] = useState([]); // Стейт для гідів
  const [loading, setLoading] = useState(true);
  const [selectedExcursionId, setSelectedExcursionId] = useState(null);
  const [newReview, setNewReview] = useState({ author: '', text: '', rating: '⭐⭐⭐⭐⭐' });
  
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ title: '', imageUrl: '', description: '', price: '' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExcursion, setNewExcursion] = useState({ title: '', imageUrl: '', description: '', price: '', guideId: '1' });

  const [tickets, setTickets] = useState([]);
  const [showTicketsModal, setShowTicketsModal] = useState(false);

  // Одночасно завантажуємо і екскурсії, і гідів з бази
  useEffect(() => {
    const fetchData = async () => {
      try {
        const exSnapshot = await getDocs(collection(db, "excursions"));
        setExcursions(exSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const guidesSnapshot = await getDocs(collection(db, "guides"));
        setGuidesList(guidesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Помилка при завантаженні:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isSuperUser && showTicketsModal) {
      const fetchTickets = async () => {
        try {
          const q = query(collection(db, "tickets"));
          const querySnapshot = await getDocs(q);
          const ticketsList = [];
          querySnapshot.forEach((doc) => {
            ticketsList.push({ id: doc.id, ...doc.data() });
          });
          ticketsList.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTickets(ticketsList);
        } catch (error) {
          console.error("Помилка завантаження білетів:", error);
        }
      };
      fetchTickets();
    }
  }, [isSuperUser, showTicketsModal]);

  const selectedExcursion = excursions.find(ex => ex.id === selectedExcursionId);
  
  // Шукаємо гіда для вибраної екскурсії
  const currentGuide = selectedExcursion 
    ? guidesList.find(guide => String(guide.id) === String(selectedExcursion.guideId)) 
    : null;
    
  const closeModal = () => setSelectedExcursionId(null);

  const handleSeedDatabase = async () => {
    try {
      for (const ex of mockExcursions) {
        await setDoc(doc(db, "excursions", String(ex.id)), ex);
      }
      const querySnapshot = await getDocs(collection(db, "excursions"));
      setExcursions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      alert("Екскурсії завантажені в базу! 🎉");
    } catch (error) {
      alert("Помилка: " + error.message);
    }
  };

  const handleAddExcursion = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "excursions"), {
        title: newExcursion.title,
        imageUrl: newExcursion.imageUrl,
        description: newExcursion.description,
        price: newExcursion.price,
        guideId: "1", // За замовчуванням ставимо першого гіда
        reviews: [] 
      });
      setExcursions([...excursions, { id: docRef.id, ...newExcursion, guideId: "1", reviews: [] }]);
      setShowAddModal(false);
      setNewExcursion({ title: '', imageUrl: '', description: '', price: '' });
      alert("Екскурсію успішно додано! ✅");
    } catch (error) {
      alert("Помилка: " + error.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const excursionRef = doc(db, "excursions", String(editId)); 
      await updateDoc(excursionRef, {
        title: editData.title,
        imageUrl: editData.imageUrl,
        description: editData.description,
        price: editData.price
      });
      setExcursions(excursions.map(ex => 
        ex.id === editId ? { ...ex, ...editData } : ex
      ));
      setEditId(null);
    } catch (error) {
      alert("Помилка: " + error.message);
    }
  };

  const handleDeleteExcursion = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm("Ви дійсно хочете назавжди видалити цю екскурсію? 🗑️")) {
      try {
        await deleteDoc(doc(db, "excursions", String(id)));
        setExcursions(excursions.filter(ex => ex.id !== id));
      } catch (error) {
        alert("Помилка: " + error.message);
      }
    }
  };

  // Оновлене додавання відгуків (тепер зберігається в Firebase)
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.text.trim()) { alert('Введіть ім\'я та відгук!'); return; }
    
    const reviewToAdd = { ...newReview };
    const updatedReviews = selectedExcursion.reviews ? [...selectedExcursion.reviews, reviewToAdd] : [reviewToAdd];

    try {
      const excursionRef = doc(db, "excursions", String(selectedExcursion.id));
      await updateDoc(excursionRef, { reviews: updatedReviews });
      
      setExcursions(excursions.map(ex => 
        ex.id === selectedExcursion.id ? { ...ex, reviews: updatedReviews } : ex
      ));
      setNewReview({ author: '', text: '', rating: '⭐⭐⭐⭐⭐' });
    } catch (error) {
      alert("Помилка при збереженні відгуку в базу: " + error.message);
    }
  };

  const handleBuyTicket = async () => {
    if (!user) { alert("Будь ласка, увійдіть у свій акаунт, щоб придбати квиток."); return; }
    try {
      await addDoc(collection(db, "tickets"), {
        excursionTitle: selectedExcursion.title,
        userEmail: user.email,
        date: new Date().toISOString()
      });
      alert(`🎉 Вітаємо! Квиток на "${selectedExcursion.title}" успішно збережено!`);
      closeModal();
    } catch (error) {
      alert("Сталася помилка: " + error.message);
    }
  };

  if (loading) {
    return <h2 style={{textAlign: 'center', marginTop: '50px', color: 'var(--accent-gold)'}}>Завантаження... ⏳</h2>;
  }

  return (
    <div className="excursions-page">
      <h2 style={{ textAlign: 'center', marginTop: '100px', fontSize: '42px', marginBottom: '10px' }}>Каталог екскурсій</h2>
      <p style={{ textAlign: 'center', fontSize: '18px', color: '#ccc', marginBottom: '40px' }}>Оберіть епоху, яку бажаєте відвідати</p>

      {isSuperUser && (
        <div style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowTicketsModal(true)} style={{ padding: '10px 20px', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>🎟 Переглянути продані білети</button>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>➕ Додати екскурсію</button>
        </div>
      )}

      {excursions.length === 0 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#ff9800', marginBottom: '15px' }}>Схоже, екскурсій поки немає або база порожня.</p>
          <button onClick={handleSeedDatabase} className="auth-submit-btn" style={{ maxWidth: '400px', cursor: 'pointer', margin: '0 auto', display: 'block' }}>
            📥 Завантажити тестові екскурсії в базу Firebase
          </button>
        </div>
      )}

      <div className="excursions-grid">
        {excursions.map(ex => (
          <div key={ex.id} className="excursion-card" style={{ position: 'relative' }}>
            {isSuperUser && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
                <button onClick={(e) => { e.stopPropagation(); setEditId(ex.id); setEditData({ title: ex.title, imageUrl: ex.imageUrl, description: ex.description, price: ex.price || '' }); }} style={{ padding: '6px 10px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }} title="Редагувати екскурсію">⚙️</button>
                <button onClick={(e) => handleDeleteExcursion(ex.id, e)} style={{ padding: '6px 10px', background: '#f44336', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#fff' }} title="Видалити екскурсію">🗑️</button>
              </div>
            )}
            <div className="image-container" onClick={() => setSelectedExcursionId(ex.id)}>
              <img src={ex.imageUrl} alt={ex.title} onError={(e) => { e.target.src = 'https://dummyimage.com/800x600/1a1a1a/c5a059.png&text=ПОМИЛКА+ФОТО'; }} />
              <div className="title-overlay">
                <h3>{ex.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div style={{ padding: '35px', width: '90%', maxWidth: '600px', background: '#151515', border: '1px solid #4CAF50', borderRadius: '12px' }}>
            <h3 style={{ color: '#4CAF50', marginTop: '0', marginBottom: '25px', textAlign: 'center' }}>➕ Додати нову екскурсію</h3>
            <form onSubmit={handleAddExcursion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Назва" required value={newExcursion.title} onChange={(e) => setNewExcursion({...newExcursion, title: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <textarea placeholder="Опис" required value={newExcursion.description} onChange={(e) => setNewExcursion({...newExcursion, description: e.target.value})} rows="4" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="URL фотографії" required value={newExcursion.imageUrl} onChange={(e) => setNewExcursion({...newExcursion, imageUrl: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="Ціна (напр. 1500 ₴)" required value={newExcursion.price} onChange={(e) => setNewExcursion({...newExcursion, price: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', color: '#ccc', padding: '12px', flex: 1, border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}>Скасувати</button>
                <button type="submit" style={{ background: '#4CAF50', color: '#fff', padding: '12px', flex: 1, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✅ Додати</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editId && (
        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div style={{ padding: '35px', width: '90%', maxWidth: '600px', background: '#151515', border: '1px solid var(--accent-gold)', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginTop: '0', marginBottom: '25px', textAlign: 'center' }}>✏️ Редагувати екскурсію</h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Назва" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <textarea placeholder="Опис" value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} rows="4" style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="URL фотографії" value={editData.imageUrl} onChange={(e) => setEditData({...editData, imageUrl: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <input type="text" placeholder="Ціна" value={editData.price} onChange={(e) => setEditData({...editData, price: e.target.value})} style={{ padding: '12px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px' }} />
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditId(null)} style={{ background: 'transparent', color: '#ccc', padding: '12px', flex: 1, border: '1px solid #555', borderRadius: '8px', cursor: 'pointer' }}>Скасувати</button>
                <button type="submit" style={{ background: 'var(--accent-gold)', color: '#111', padding: '12px', flex: 1, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTicketsModal && (
        <div className="modal-overlay" onClick={() => setShowTicketsModal(false)} style={{ zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div onClick={e => e.stopPropagation()} style={{ padding: '30px', width: '90%', maxWidth: '600px', background: '#151515', border: '1px solid var(--accent-gold)', borderRadius: '12px', color: '#fff', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginTop: 0 }}>🧾 Журнал продажу</h3>
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px', marginTop: '15px' }}>
              {tickets.length === 0 ? <p style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Білетів ще немає.</p> : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tickets.map(t => (
                    <li key={t.id} style={{ background: '#222', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{t.excursionTitle}</div>
                      <div style={{ fontSize: '14px', color: '#ccc' }}>👤 Покупець: {t.userEmail}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>🕒 {new Date(t.date).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => setShowTicketsModal(false)} style={{ marginTop: '20px', padding: '12px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Закрити</button>
          </div>
        </div>
      )}

      {selectedExcursion && !editId && (
        <div className="modal-overlay" onClick={closeModal} style={{ 
          zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.85)' 
        }}>
          
          {/* ЄДИНИЙ ТЕМНИЙ КОНТЕЙНЕР НА ВСЕ */}
          <div onClick={e => e.stopPropagation()} style={{ 
            background: '#1a1a1a', /* ОСЬ ВІН, ОДИН ТОН */
            color: '#ffffff', 
            padding: '40px', 
            borderRadius: '12px', 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '40px', 
            maxWidth: '900px', 
            width: '90%', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            position: 'relative',
            boxSizing: 'border-box',
            border: '1px solid #333'
          }}>
            
            {/* КНОПКА ЗАКРИТТЯ */}
            <button onClick={closeModal} style={{ 
              position: 'absolute', top: '15px', right: '15px', background: 'transparent', 
              border: 'none', color: '#c5a059', fontSize: '24px', cursor: 'pointer' 
            }}>✕</button>
            
            {/* ЛІВА ЧАСТИНА: КАРТИНКА */}
            <div style={{ flex: '1' }}>
              <img src={selectedExcursion.imageUrl} alt={selectedExcursion.title} style={{ 
                width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'cover', display: 'block' 
              }} onError={(e) => { e.target.src = 'https://dummyimage.com/800x600/1a1a1a/c5a059.png&text=ПОМИЛКА+ФОТО'; }} />
            </div>
            
            {/* ПРАВА ЧАСТИНА: ІНФА (БЕЗ БІЛИХ БЛОКІВ) */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              
              <h2 style={{ marginTop: 0, color: '#c5a059', fontSize: '28px', marginBottom: '15px' }}>
                {selectedExcursion.title}
              </h2>
              
              <p style={{ color: '#cccccc', lineHeight: '1.6', marginBottom: '30px' }}>
                {selectedExcursion.description}
              </p>
              
              {/* ЦІНА І КНОПКА */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>ВАРТІСТЬ</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedExcursion.price}</span>
                </div>
                <button onClick={handleBuyTicket} style={{ 
                  background: '#c5a059', color: '#000', border: 'none', padding: '12px 24px', 
                  borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' 
                }}>
                  ПРИДБАТИ КВИТОК
                </button>
              </div>
              
              {/* ВІДГУКИ */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#fff' }}>Відгуки мандрівників:</h3>
                
                <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
                  {selectedExcursion.reviews && selectedExcursion.reviews.length > 0 ? (
                    selectedExcursion.reviews.map((r, i) => (
                      <div key={i} style={{ marginBottom: '15px' }}>
                        <strong style={{ display: 'block', color: '#c5a059', marginBottom: '5px' }}>
                          {r.author} {r.rating || '★★★★★'}
                        </strong>
                        <span style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.4' }}>{r.text}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#666', fontSize: '14px' }}>Поки немає відгуків.</p>
                  )}
                </div>
                
                {/* ФОРМА */}
                <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input type="text" placeholder="Ваше ім'я" value={newReview.author} onChange={e => setNewReview({...newReview, author: e.target.value})} required style={{ 
                    padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', outline: 'none' 
                  }} />
                  <textarea placeholder="Ваш відгук" value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} required style={{ 
                    padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', resize: 'vertical', minHeight: '60px', outline: 'none' 
                  }} />
                  <button type="submit" style={{ 
                    padding: '10px', background: 'transparent', color: '#c5a059', border: '1px solid #c5a059', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                  }}>Надіслати відгук</button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. СТОРІНКА ПРОФІЛЮ
function ProfilePage({ user }) {
  const [profileData, setProfileData] = useState({ name: '', phone: '', photoUrl: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(user?.emailVerified || false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  
  // Додаємо стейти для квитків
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Завантажуємо дані профілю
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (user.email && data.email !== user.email) {
            await updateDoc(docRef, { email: user.email });
            data.email = user.email;
          }
          setProfileData(data);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  // Завантажуємо квитки КОНКРЕТНОГО користувача
  useEffect(() => {
    if (user?.email) {
      const fetchMyTickets = async () => {
        try {
          // Шукаємо квитки, де email співпадає з email поточного юзера
          const q = query(collection(db, "tickets"), where("userEmail", "==", user.email));
          const querySnapshot = await getDocs(q);
          const ticketsList = [];
          querySnapshot.forEach((doc) => {
            ticketsList.push({ id: doc.id, ...doc.data() });
          });
          
          // Сортуємо: найновіші зверху
          ticketsList.sort((a, b) => new Date(b.date) - new Date(a.date));
          setMyTickets(ticketsList);
        } catch (error) {
          console.error("Помилка завантаження квитків:", error);
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchMyTickets();
    }
  }, [user]);

  const handleUpdateEmail = async () => {
    if (!newEmailInput.includes('@')) { alert("Введіть коректну адресу!"); return; }
    try {
      await verifyBeforeUpdateEmail(auth.currentUser, newEmailInput);
      setIsEditingEmail(false);
      alert(`Лист відправлено на ${newEmailInput}!`);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert("З міркувань безпеки треба вийти і зайти знову.");
      } else {
        alert("Помилка: " + error.message);
      }
    }
  };

  const handleCheckVerification = async () => {
    if (user) {
      try {
        await user.reload(); 
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          if (profileData.email !== auth.currentUser.email) {
            await updateDoc(doc(db, "users", user.uid), { email: auth.currentUser.email });
            setProfileData(prev => ({...prev, email: auth.currentUser.email}));
          }
          alert("Супер! Пошту підтверджено. 🏛️");
        } else {
          alert("Пошту ще не підтверджено. Перевірте вхідні. ⏳");
        }
      } catch (error) { console.error(error); }
    }
  };

  const handleResendEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        alert("Лист відправлено повторно!");
      } catch (error) { alert("Зачекайте хвилинку перед відправкою."); }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileData.phone && !/^\+?[0-9]{10,15}$/.test(profileData.phone)) { alert("Невірний телефон!"); return; }
    try {
      await updateDoc(doc(db, "users", user.uid), { 
        name: profileData.name, 
        phone: profileData.phone, 
        photoUrl: profileData.photoUrl 
      });
      alert("Профіль оновлено! 🎉");
    } catch (error) { alert("Не вдалося зберегти."); }
  };

  if (loading) {
    return <h2 style={{textAlign: 'center', marginTop: '50px', color: 'var(--accent-gold)'}}>Завантаження...</h2>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="auth-page" style={{ flexDirection: 'column', padding: '40px 20px', gap: '30px', marginTop: '60px' }}>
      
      {/* КАРТОЧКА ПРОФІЛЮ */}
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%', margin: '0' }}>
        <h2>Особистий кабінет</h2>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src={profileData.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Аватар" 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)' }} 
          />
        </div>
        <form onSubmit={handleSaveProfile} className="auth-form">
          <div className="input-group">
            <label>Ваш Email</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isEditingEmail ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="email" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid var(--accent-gold)', background: '#222', color: 'white' }} />
                  <button type="button" onClick={handleUpdateEmail} style={{ background: 'var(--accent-gold)', color: '#111', border: 'none', padding: '0 15px', borderRadius: '4px', cursor: 'pointer' }}>Зберегти</button>
                  <button type="button" onClick={() => setIsEditingEmail(false)} style={{ background: 'transparent', color: '#ccc', border: '1px solid #444', padding: '0 15px', borderRadius: '4px', cursor: 'pointer' }}>Скасувати</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="email" value={profileData.email || user.email} disabled style={{opacity: 0.7, flex: 1}} />
                  <button type="button" onClick={() => { setIsEditingEmail(true); setNewEmailInput(profileData.email || user.email); }} style={{ background: 'transparent', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '0 15px', borderRadius: '4px', cursor: 'pointer' }}>✏️ Змінити</button>
                </div>
              )}
              {isVerified ? (
                <div style={{ padding: '12px 15px', backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--accent-gold)', borderRadius: '6px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                  <span style={{ fontSize: '18px' }}>📜</span> Вашу пошту підтверджено
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '15px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e6a15c', fontSize: '14px', fontWeight: 'bold' }}>
                    <span>⏳</span> <span>Очікуємо підтвердження</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '5px' }}>
                    <button type="button" onClick={handleCheckVerification} style={{ background: 'var(--accent-gold)', color: '#111', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flex: 1 }}>🔄 Я підтвердив(ла)</button>
                    <button type="button" onClick={handleResendEmail} style={{ background: 'transparent', color: '#ccc', border: '1px solid #444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', flex: 1 }}>✉️ Надіслати ще раз</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="input-group">
            <label>Ім'я</label>
            <input type="text" value={profileData.name || ''} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Номер телефону</label>
            <input type="tel" value={profileData.phone || ''} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Фото (URL)</label>
            <input type="text" value={profileData.photoUrl || ''} onChange={(e) => setProfileData({...profileData, photoUrl: e.target.value})} />
          </div>
          <button type="submit" className="auth-submit-btn">Зберегти зміни</button>
        </form>
      </div>

      {/* КАРТОЧКА З КВИТКАМИ */}
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%', margin: '0' }}>
        <h2 style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>🎟️ Мої квитки</h2>
        
        {loadingTickets ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>Завантаження квитків... ⏳</p>
        ) : myTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#aaa', marginBottom: '15px' }}>У вас ще немає жодного квитка.</p>
            <Link to="/excursions" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--accent-gold)', color: '#000', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>Обрати екскурсію</Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myTickets.map(ticket => (
              <li key={ticket.id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--accent-gold)', border: '1px solid #333' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: '#fff' }}>
                  {ticket.excursionTitle}
                </div>
                <div style={{ fontSize: '13px', color: '#aaa' }}>
                  🕒 Придбано: {new Date(ticket.date).toLocaleString()}
                </div>
                <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 8px', background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', borderRadius: '4px', fontSize: '12px', border: '1px solid #4CAF50' }}>
                  Оплачено✅
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

// 5. СТОРІНКА АВТОРИЗАЦІЇ
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/profile');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await setDoc(doc(db, "users", userCredential.user.uid), { 
          email: userCredential.user.email, 
          name: name, 
          phone: '', 
          photoUrl: '', 
          role: "visitor", 
          createdAt: new Date().toISOString() 
        });
        alert("Акаунт створено! Перевірте пошту.");
        navigate('/profile');
      }
    } catch (error) { 
      alert("Помилка: " + error.message); 
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isLogin ? 'Вхід' : 'Реєстрація'}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Ім'я</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Пароль</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              minLength={6} 
            />
          </div>
          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Увійти' : 'Створити акаунт'}
          </button>
        </form>
        <div className="auth-switch">
          <p>
            {isLogin ? 'Ще не маєте акаунта?' : 'Вже є акаунт?'} 
            <span 
              onClick={() => setIsLogin(!isLogin)} 
              style={{cursor: 'pointer', color: 'var(--accent-gold)'}}
            >
              {isLogin ? ' Реєстрація' : ' Вхід'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// 6. ГОЛОВНИЙ КОМПОНЕНТ APP
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => { 
    await signOut(auth); 
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <header className="header">
          <div className="logo">
            <Link to="/">🏛️ Museum of Time</Link>
          </div>
          <nav className="nav-links">
            <Link to="/">Головна</Link>
            <Link to="/excursions">Екскурсії</Link>
            <Link to="/guides">ЕКСКУРСОВОДИ</Link>
            {user ? (
              <>
                <Link to="/profile" style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                  Мій профіль
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="login-btn" 
                  style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '8px 16px', borderRadius: '4px' }}
                >
                  Вийти
                </button>
              </>
            ) : (
              <Link to="/login" className="login-btn">Вхід</Link>
            )}
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/excursions" element={<ExcursionsPage user={user} />} />
            <Route path="/guides" element={<GuidesPage user={user} />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage user={user} />} />
          </Routes>
        </main>

        <footer className="footer" style={{ padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div>
              <iframe 
                title="Museum Location" 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2633.324578136365!2d25.039235915668636!3d48.52846467925695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4736d29622d14bc1%3A0x6b77cd52d194c257!2z0LLRg9C7LiDQkNC90YLQvtC90LAg0KfQtdGF0L7QstCwLCAyMCwg0JrQvtC70L7QvNC40Y8sINCG0LLQsNC90L4t0KTRgNCw0L3QutGW0LLRgdGM0LrQsCDQvtCx0LvQsNGB0YLRjCwgNzgyMDA!5e0!3m2!1suk!2sua!4v1698765432109!5m2!1suk!2sua" 
                width="360" 
                height="200" 
                style={{ border: 0, borderRadius: '15px', filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(85%)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div style={{ textAlign: 'left', color: '#888', fontSize: '15px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-gold)', fontSize: '20px' }}>
                🏛 Museum of Time
              </h3>
              <p style={{ margin: '6px 0' }}>
                © {new Date().getFullYear()} Всі права захищено.
              </p>
              <p style={{ margin: '12px 0 6px 0', display: 'flex', alignItems: 'center', color: '#ccc' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--accent-gold)', marginRight: '10px', borderRadius: '2px' }}></span>
                вул. Антона Чехова, 20, Коломия
              </p>
              <p style={{ margin: '6px 0', display: 'flex', alignItems: 'center', color: '#ccc' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--accent-gold)', marginRight: '10px', borderRadius: '2px' }}></span>
                +380 (44) 123-45-67
              </p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;