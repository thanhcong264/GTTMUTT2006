import pandas as pd

def generate_road_data():
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
    
    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    df_roads = generate_road_data()
    print("Dữ liệu mẫu:")
    print(df_roads)
    # Lưu ra file CSV (Tùy chọn)
    df_roads.to_csv("road_data_sample.csv", index=False, encoding='utf-8-sig')
