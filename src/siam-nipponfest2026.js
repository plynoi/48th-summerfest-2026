(()=>{
    // set URL of the JSON file containing the schedule data
    const json_url = './src/members-schedule.json';
    // initialize an empty array to hold the schedule data
    let scheduleData = [];
    // เก็บรายการข้อมูลเมมเบอร์และกิจกรรมทั้งหมด (ไม่ต้องคำนวณใหม่ทุกรอบ)
    let allMembers = [];
    let allActivities = [];
    let timeSortAsc = true; // ตัวแปรเก็บสถานะการเรียงลำดับเวลา (true = น้อยไปมาก, false = มากไปน้อย)
    // กำหนดรายชื่อเมมเบอร์โอชิของ plynoi ไว้ในตัวแปร เพื่อใช้ในการกรองข้อมูล
    const oshiMembers = ["Emmy","Hoop","Jew","Khowjow","Lingling","Luksorn","Pancake","Yoghurt"];
    // กำหนดราคากิจกรรมแยกออกมา เพื่อให้แก้ไขและอัปเดตได้ง่าย
    const activityPrices = {
        "ไม่พร้อมค่ะ": "🎟️ 1 Ticket",
        "ดูแปลกๆนะคะ": "🎟️ 1 Ticket",
        "The Shoot Sisters": "🎟️ 1 Ticket",
        "โดนนนนตก!": "🎟️ 2 Tickets",
        "Shot Me Girls": "🎟️ 5 Tickets",
        "ฮับขวัญฮื้อ(ด้าย)ไหม่เจ้า?": "🏷️ 200.-/Set",
        "Hachi Cha": "-",
        "Merchandise": "-"
    };

    // Cache DOM Elements ไว้ใช้งานเพื่อประสิทธิภาพที่ดียิ่งขึ้น
    const dom = {
        dayFilter: document.getElementById("dayFilter"),
        memberFilter: document.getElementById("memberFilter"),
        activityFilter: document.getElementById("activityFilter"),
        oshiCheck: document.getElementById("oshiCheck"),
        tbody: document.getElementById("scheduleBody"),
        timeHeader: document.querySelector("th:nth-child(2)") // ดึงอ้างอิงของคอลัมน์ 'เวลา'
    };

    // ฟังก์ชันสำหรับดึงข้อมูลจากไฟล์ JSON และจัดการข้อผิดพลาด
    async function fetchScheduleData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return []; // คืนค่า array ว่างเพื่อป้องกันไม่ให้โค้ดส่วนอื่นแครช
        }
    }

    // ฟังก์ชันสำหรับกำหนดคลาสสีตามประเภทของกิจกรรม
    function getActivityColorClass(act) {
        // ใช้ Object Mapping จะอ่านง่ายและเร็วกว่าการต่อ if-else ยาวๆ
        const classes = {
            "ไม่พร้อมค่ะ": "act-mai",
            "ดูแปลกๆนะคะ": "act-du",
            "The Shoot Sisters": "act-sisters",
            "โดนนนนตก!": "act-don",
            "Shot Me Girls": "act-shot",
            "ฮับขวัญฮื้อ(ด้าย)ไหม่เจ้า?": "act-hub",
            "Hachi Cha": "act-hachi",
            "Merchandise": "act-merch"
        };
        return classes[act] || "";
    }

    // ฟังก์ชันสำหรับแสดงตารางกิจกรรมตามตัวกรองที่เลือก
    function renderTable() {
        const dayValue = dom.dayFilter.value;
        const memberValue = dom.memberFilter.value;
        const actValue = dom.activityFilter.value;
        const showOnlyOshi = dom.oshiCheck?.checked;

        // กรองข้อมูลตามตัวกรองที่เลือก โดยพิจารณาทั้งวัน, เมมเบอร์, กิจกรรม และเงื่อนไขการแสดงเฉพาะโอชิ
        const filteredData = scheduleData.filter(item => {
            const matchDay = dayValue === "all" || item.day === dayValue;
            const matchMember = memberValue === "all" 
                ? (showOnlyOshi ? oshiMembers.includes(item.member) : true)
                : item.member === memberValue;
            const matchAct = actValue === "all" || item.activity === actValue;
            return matchDay && matchMember && matchAct;
        });

        // จัดการเรื่องการเรียงลำดับข้อมูลตามปฏิทิน (วันที่ -> เวลา)
        filteredData.sort((a, b) => {
            const dayOrder = { "ศุกร์ 27 มี.ค.": 1, "เสาร์ 28 มี.ค.": 2, "อาทิตย์ 29 มี.ค.": 3 };
            const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
            
            if (dayDiff !== 0) {
                return timeSortAsc ? dayDiff : -dayDiff; // สลับลำดับวันด้วยเมื่อมีการสลับเวลา
            }
            return timeSortAsc ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time);
        });

        // อัปเดตข้อความและ UI บนหัวตารางคอลัมน์เวลา
        if (dom.timeHeader) {
            dom.timeHeader.innerHTML = `เวลา ${timeSortAsc ? '🔼' : '🔽'}`;
            dom.timeHeader.style.cursor = 'pointer';
            dom.timeHeader.title = 'คลิกเพื่อสลับการเรียงลำดับเวลา';
        }

        // หากไม่มีข้อมูลที่ตรงกับตัวกรอง ให้แสดงข้อความแจ้งว่าไม่พบตารางกิจกรรม
        if (filteredData.length === 0) {
            dom.tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#888; padding: 20px;">ไม่พบตารางกิจกรรม</td></tr>`;
            return;
        }

        // ใช้ .map().join('') มีประสิทธิภาพเร็วกว่าการวนลูปสร้าง Element ทีละแถว
        dom.tbody.innerHTML = filteredData.map(item => `
            <tr>
                <td>${item.day}</td>
                <td><strong>${item.time}</strong></td>
                <td><span class="member-badge">${item.member}</span></td>
                <td><span class="activity-badge ${getActivityColorClass(item.activity)}">${item.activity}</span></td>
                <td class="price-text">${activityPrices[item.activity] || "-"}</td>
            </tr>
        `).join('');
    }

    // ฟังก์ชันรวบรวมตัวเลือก (รันครั้งเดียวหลังดึงข้อมูลสำเร็จ)
    function extractFilterData() {
        const membersSet = new Set();
        const activitiesMap = new Map();

        scheduleData.forEach(item => {
            membersSet.add(item.member);
            if (!activitiesMap.has(item.activity)) {
                let price = activityPrices[item.activity] || '';
                let priceText = '';
                if (price.includes('Ticket')) {
                    priceText = ` (${price.replace('🎟️ ', '')})`;
                } else if (price.includes('.-')) {
                    priceText = ` (${price.replace('🏷️ ', '').replace('/Set', '')})`;
                }
                activitiesMap.set(item.activity, `${item.activity}${priceText}`);
            }
        });

        allMembers = [...membersSet].sort((a, b) => a.localeCompare(b, 'en'));
        allActivities = [...activitiesMap.entries()].sort((a, b) => a[0].localeCompare(b[0], 'th'));
    }

    // ฟังก์ชันสำหรับเติมตัวเลือกในฟิลเตอร์เมมเบอร์และกิจกรรม และจัดการการแสดงผลตามเงื่อนไขต่างๆ
    function populateFilters() {
        // จดจำค่าที่ถูกเลือกไว้ก่อนเคลียร์ข้อมูลใหม่
        const currentMember = dom.memberFilter.value;
        const currentActivity = dom.activityFilter.value;
        const showOnlyOshi = dom.oshiCheck?.checked;
        
        // กรองเฉพาะเมมเบอร์โอชิ หาก Checkbox ถูกเลือก
        const sortedMembers = showOnlyOshi 
            ? allMembers.filter(m => oshiMembers.includes(m))
            : allMembers;

        // สร้าง HTML Option ด้วย string template รวดเร็วกว่าการทำ DOM Creation ทีละอัน
        dom.memberFilter.innerHTML = '<option value="all">👩‍🎤 เมมเบอร์ทุกคน</option>' + 
            sortedMembers.map(m => `<option value="${m}">${m}</option>`).join('');
            
        dom.activityFilter.innerHTML = '<option value="all">🎪 ทุกกิจกรรม</option>' + 
            allActivities.map(([val, text]) => `<option value="${val}">${text}</option>`).join('');

        // คืนค่าที่เลือกไว้ หรือสลับเป็น "all" หากเมมเบอร์ที่เลือกก่อนหน้าไม่อยู่ในเงื่อนไขปัจจุบัน
        dom.memberFilter.value = sortedMembers.includes(currentMember) ? currentMember : "all";
        dom.activityFilter.value = currentActivity || "all";
        // แสดงตารางกิจกรรมตามตัวกรองที่อัปเดตแล้ว
        renderTable();
    }

    function setupEventListeners() {
        dom.oshiCheck.addEventListener('change', populateFilters);
        dom.memberFilter.addEventListener('change', renderTable);
        dom.dayFilter.addEventListener('change', renderTable);
        dom.activityFilter.addEventListener('change', renderTable);
        if (dom.timeHeader) {
            dom.timeHeader.addEventListener('click', () => {
                timeSortAsc = !timeSortAsc; // สลับสถานะ
                renderTable(); // วาดตารางใหม่
            });
        }
    }
        
    // เมื่อโหลดหน้าเว็บเสร็จสิ้น ให้ดึงข้อมูลจาก JSON และเติมตัวเลือกในฟิลเตอร์
    document.addEventListener('DOMContentLoaded', async () => {
        if (!dom.tbody) return; // ทำงานเฉพาะในหน้าที่มีตาราง
        scheduleData = await fetchScheduleData(json_url);
        extractFilterData();
        populateFilters();
        setupEventListeners();
    });

})();