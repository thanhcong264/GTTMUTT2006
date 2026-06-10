import streamlit as st
from PIL import Image
import cv2
import numpy as np
import pandas as pd
import folium
from streamlit_folium import st_folium

def calculate_pixel_percentage(pil_image):
    # Chuyển đổi từ PIL Image sang mảng NumPy
    img_array = np.array(pil_image.convert('RGB'))
    
    # Chuyển đổi sang ảnh xám
    gray_img = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Áp dụng ngưỡng (Thresholding) để tạo ảnh nhị phân đen/trắng (Ngưỡng 127)
    _, binary_img = cv2.threshold(gray_img, 127, 255, cv2.THRESH_BINARY)
    
    # Đếm số pixel đen (0) và trắng (255)
    white_pixels = np.sum(binary_img == 255)
    black_pixels = np.sum(binary_img == 0)
    total_pixels = white_pixels + black_pixels
    
    # Tính tỷ lệ %
    black_percentage = (black_pixels / total_pixels) * 100
    white_percentage = (white_pixels / total_pixels) * 100
    
    return black_percentage, white_percentage, binary_img

def load_road_data():
    data = {
        "Ten_Duong": [
            "Quốc lộ 1A (Đoạn qua Hà Nội)", 
            "Đường Nguyễn Trãi (Hà Nội)", 
            "Đường Liên Thôn (Đan Phượng)", 
            "Đường cao tốc Bắc - Nam", 
            "Hẻm 123 (Quận 1, TP.HCM)", 
            "Đường ven biển (Đà Nẵng)"
        ],
        "Lat_Dau": [20.9000, 20.9930, 21.0950, 19.8000, 10.7760, 16.0500],
        "Lon_Dau": [105.8500, 105.8110, 105.7000, 105.9000, 106.7010, 108.2300],
        "Lat_Cuoi": [20.8500, 20.9850, 21.0960, 19.7000, 10.7770, 16.0300],
        "Lon_Cuoi": [105.8600, 105.7950, 105.7050, 105.9500, 106.7020, 108.2400],
        "Loai_Mat_Duong": ["Nhựa", "Nhựa", "Bê tông", "Nhựa", "Bê tông", "Nhựa"],
        "Chieu_Dai_km": [5.5, 2.3, 0.8, 15.0, 0.3, 1.2],
        "Ty_Le_Nut_phantram": [12.5, 5.0, 20.0, 2.1, 15.0, 8.4]
    }
    return pd.DataFrame(data)

# Cấu hình trang web (tiêu đề, icon)
st.set_page_config(
    page_title="Nhận diện vết nứt mặt đường",
    page_icon="🛣️",
    layout="wide"
)

# Thêm tiêu đề và mô tả cho ứng dụng
st.title("🛣️ Ứng dụng Phân tích Vết nứt Mặt đường")
st.write("Ứng dụng hỗ trợ phân tích hình ảnh vết nứt và hiển thị bản đồ theo dõi các tuyến đường.")

# Tạo 2 tab trên giao diện
tab1, tab2 = st.tabs(["📸 Phân tích Ảnh", "🗺️ Bản đồ Tuyến đường"])

with tab1:
    st.header("Phân tích ảnh mặt đường")

    # Tạo nút upload file, chỉ cho phép các định dạng ảnh
    uploaded_file = st.file_uploader("Chọn một bức ảnh...", type=["jpg", "jpeg", "png"])

    # Kiểm tra xem người dùng đã upload ảnh lên chưa
    if uploaded_file is not None:
        try:
            # Đọc ảnh bằng thư viện Pillow (PIL)
            image = Image.open(uploaded_file)
            
            # Hiển thị ảnh lên giao diện Streamlit
            st.image(image, caption='Ảnh mặt đường đã tải lên', use_column_width=True)
            
            # Thêm một nút giả lập (chưa có chức năng AI thật)
            st.success("Tải ảnh lên thành công!")
            
            if st.button("Phân tích ảnh"):
                with st.spinner("Đang xử lý ảnh bằng OpenCV..."):
                    black_pct, white_pct, binary_result = calculate_pixel_percentage(image)
                    
                st.success("Phân tích hoàn tất!")
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Tỷ lệ màu đen", f"{black_pct:.2f}%")
                with col2:
                    st.metric("Tỷ lệ màu trắng", f"{white_pct:.2f}%")
                    
                st.image(binary_result, caption='Ảnh nhị phân (Đen/Trắng)', use_column_width=True)            
        except Exception as e:
            st.error(f"Đã xảy ra lỗi khi đọc ảnh: {e}")
    else:
        st.info("Vui lòng tải một bức ảnh lên để bắt đầu.")

with tab2:
    st.header("Bản đồ Tình trạng Nứt Mặt Đường")
    
    # Lấy dữ liệu
    df = load_road_data()
    
    # ===== CẤU HÌNH THANH SIDEBAR (Bên trái) =====
    st.sidebar.header("⚙️ Bộ Lọc Bản Đồ")
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("🛣️ Loại mặt đường")
    
    # Checkbox lọc loại mặt đường: Chỉ chọn đường Nhựa
    only_asphalt = st.sidebar.checkbox(
        "Chỉ hiển thị đường Nhựa",
        value=False,
        help="Bật để chỉ hiển thị các đoạn đường có mặt đường loại Nhựa"
    )
    
    st.sidebar.markdown("---")
    st.sidebar.subheader("📏 Chiều dài đoạn đường")
    
    # Checkbox lọc chiều dài: Chỉ hiển thị đường dài > 1km
    only_long_roads = st.sidebar.checkbox(
        "Chỉ hiển thị đường dài > 1 km",
        value=False,
        help="Bật để chỉ hiển thị các đoạn đường có chiều dài lớn hơn 1 km"
    )
    
    # Slider bổ sung: cho phép người dùng tùy chỉnh chiều dài tối thiểu
    min_len = float(df["Chieu_Dai_km"].min())
    max_len = float(df["Chieu_Dai_km"].max())
    
    if only_long_roads:
        # Khi checkbox bật, slider bắt đầu từ 1.0
        min_length = st.sidebar.slider(
            "Chiều dài tối thiểu (km):",
            min_value=1.0,
            max_value=max_len,
            value=1.0,
            step=0.5
        )
    else:
        min_length = st.sidebar.slider(
            "Chiều dài tối thiểu (km):",
            min_value=min_len,
            max_value=max_len,
            value=min_len,
            step=0.1
        )
    
    # ===== LỌC DỮ LIỆU =====
    filtered_df = df.copy()
    
    # Lọc theo loại mặt đường
    if only_asphalt:
        filtered_df = filtered_df[filtered_df["Loai_Mat_Duong"] == "Nhựa"]
    
    # Lọc theo chiều dài
    filtered_df = filtered_df[filtered_df["Chieu_Dai_km"] >= min_length]
    
    # Hiển thị thông tin bộ lọc trên sidebar
    st.sidebar.markdown("---")
    st.sidebar.info(f"📊 Đang hiển thị **{len(filtered_df)}** / {len(df)} đoạn đường")
    
    # ===== HIỂN THỊ BẢNG DỮ LIỆU =====
    st.write("### 📋 Bảng dữ liệu tuyến đường (Đã lọc)")
    st.dataframe(filtered_df, use_container_width=True)
    
    # ===== VẼ BẢN ĐỒ BẰNG FOLIUM =====
    st.write("### 🗺️ Bản đồ trực quan (Folium)")
    
    # Tạo bản đồ trung tâm Việt Nam
    m = folium.Map(location=[16.0500, 107.000], zoom_start=6, tiles="CartoDB positron")
    
    # Hàm chọn màu dựa trên tỷ lệ nứt
    def get_crack_color(crack_pct):
        if crack_pct >= 15:
            return "#e74c3c"  # Đỏ - Nứt nghiêm trọng
        elif crack_pct >= 8:
            return "#f39c12"  # Cam - Nứt trung bình
        elif crack_pct >= 4:
            return "#f1c40f"  # Vàng - Nứt nhẹ
        else:
            return "#2ecc71"  # Xanh lá - Tốt
    
    # Hàm đánh giá mức độ nứt
    def get_crack_level(crack_pct):
        if crack_pct >= 15:
            return "🔴 Nghiêm trọng"
        elif crack_pct >= 8:
            return "🟠 Trung bình"
        elif crack_pct >= 4:
            return "🟡 Nhẹ"
        else:
            return "🟢 Tốt"
    
    # Vẽ từng tuyến đường lên bản đồ
    for _, row in filtered_df.iterrows():
        # Dữ liệu toạ độ cho đường thẳng (Tuyến đường)
        points = [
            [row["Lat_Dau"], row["Lon_Dau"]],
            [row["Lat_Cuoi"], row["Lon_Cuoi"]]
        ]
        
        crack_color = get_crack_color(row["Ty_Le_Nut_phantram"])
        crack_level = get_crack_level(row["Ty_Le_Nut_phantram"])
        
        # Popup HTML với thông tin chi tiết khi click vào đoạn đường
        popup_html = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 250px; padding: 5px;">
            <h4 style="margin: 0 0 8px 0; color: #2c3e50; border-bottom: 2px solid {crack_color}; padding-bottom: 5px;">
                🛣️ {row['Ten_Duong']}
            </h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                    <td style="padding: 4px 8px; color: #7f8c8d;"><b>Loại mặt đường:</b></td>
                    <td style="padding: 4px 8px;">{row['Loai_Mat_Duong']}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                    <td style="padding: 4px 8px; color: #7f8c8d;"><b>Chiều dài:</b></td>
                    <td style="padding: 4px 8px;">{row['Chieu_Dai_km']} km</td>
                </tr>
                <tr>
                    <td style="padding: 4px 8px; color: #7f8c8d;"><b>Tỷ lệ nứt:</b></td>
                    <td style="padding: 4px 8px;">
                        <span style="color: {crack_color}; font-weight: bold; font-size: 16px;">
                            {row['Ty_Le_Nut_phantram']}%
                        </span>
                    </td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                    <td style="padding: 4px 8px; color: #7f8c8d;"><b>Đánh giá:</b></td>
                    <td style="padding: 4px 8px; font-weight: bold;">{crack_level}</td>
                </tr>
            </table>
        </div>
        """
        
        # Tooltip khi hover chuột
        tooltip_text = f"📍 {row['Ten_Duong']} | Nứt: {row['Ty_Le_Nut_phantram']}%"
        
        # Vẽ PolyLine (Đoạn đường)
        folium.PolyLine(
            locations=points,
            color=crack_color,
            weight=7,
            opacity=0.85,
            tooltip=folium.Tooltip(tooltip_text, sticky=True),
            popup=folium.Popup(popup_html, max_width=350)
        ).add_to(m)
        
        # Thêm marker tại điểm giữa đoạn đường
        mid_lat = (row["Lat_Dau"] + row["Lat_Cuoi"]) / 2
        mid_lon = (row["Lon_Dau"] + row["Lon_Cuoi"]) / 2
        
        folium.CircleMarker(
            location=[mid_lat, mid_lon],
            radius=5,
            color=crack_color,
            fill=True,
            fill_color=crack_color,
            fill_opacity=0.9,
            tooltip=f"{row['Ten_Duong']}",
            popup=folium.Popup(popup_html, max_width=350)
        ).add_to(m)

    # Thêm chú thích (Legend) vào bản đồ
    legend_html = """
    <div style="position: fixed; bottom: 30px; left: 30px; z-index: 1000; 
                background-color: white; padding: 12px 16px; border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-size: 13px;
                font-family: 'Segoe UI', Arial, sans-serif;">
        <b style="font-size: 14px;">📊 Mức độ nứt</b><br><br>
        <span style="color: #2ecc71;">●</span> Tốt (< 4%)<br>
        <span style="color: #f1c40f;">●</span> Nhẹ (4% - 8%)<br>
        <span style="color: #f39c12;">●</span> Trung bình (8% - 15%)<br>
        <span style="color: #e74c3c;">●</span> Nghiêm trọng (≥ 15%)<br>
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))

    # Hiển thị bản đồ Folium lên Streamlit
    map_data = st_folium(m, width=900, height=600, use_container_width=True)
