-- ENUM TYPES (hướng đối tượng - PostgreSQL)


CREATE TYPE trang_thai_chung        AS ENUM ('HOAT_DONG', 'NGUNG_HOAT_DONG');
CREATE TYPE loai_chi_nhanh          AS ENUM ('KHO_TRUNG_TAM', 'CUA_HANG_BAN_LE');
CREATE TYPE loai_thuoc_tinh         AS ENUM ('KICH_THUOC', 'MAU_SAC');
CREATE TYPE loai_kenh_banhang       AS ENUM ('CUA_HANG', 'WEBSITE', 'SAN_TMDT', 'MANG_XA_HOI');
CREATE TYPE trang_thai_phieu_nhap   AS ENUM ('CHO_DUYET', 'DA_DUYET', 'HUY');
CREATE TYPE trang_thai_phieu_chuyen AS ENUM ('CHO_DUYET', 'DA_DUYET', 'DANG_VAN_CHUYEN', 'HOAN_THANH', 'HUY');
CREATE TYPE trang_thai_kiem_kho     AS ENUM ('DANG_KIEM', 'CHO_CAN_BANG', 'DA_CAN_BANG', 'HUY');
CREATE TYPE trang_thai_don_hang     AS ENUM ('CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_XU_LY', 'DANG_GIAO', 'HOAN_THANH', 'HUY', 'HOAN_HANG');
CREATE TYPE trang_thai_thanh_toan   AS ENUM ('CHUA_THANH_TOAN', 'DA_THANH_TOAN', 'HOAN_TIEN');
CREATE TYPE phuong_thuc_thanh_toan  AS ENUM ('TIEN_MAT', 'CHUYEN_KHOAN', 'COD', 'VNPAY', 'MOMO');
CREATE TYPE trang_thai_hoa_don      AS ENUM ('NHAP', 'DA_XUAT_KHO', 'HOAN_THANH', 'HUY');
CREATE TYPE loai_giao_dich_kho      AS ENUM ('NHAP_HANG', 'XUAT_BAN', 'XUAT_CHUYEN', 'NHAP_CHUYEN', 'DIEU_CHINH_KIEM_KHO', 'HOAN_HANG');
CREATE TYPE loai_tham_chieu_kho     AS ENUM ('PHIEU_NHAP', 'HOA_DON', 'PHIEU_CHUYEN', 'PHIEU_KIEM_KHO', 'THU_CONG');


 
-- NHÓM 1: HÀNG HOÁ
 

CREATE TABLE NHOMHANG (
    MaNhomHang      VARCHAR(20)         NOT NULL,
    TenNhomHang     VARCHAR(100)        NOT NULL,
    MoTa            TEXT,
    CONSTRAINT PK_NhomHang PRIMARY KEY (MaNhomHang)
);

CREATE TABLE SANPHAM (
    MaSanPham       VARCHAR(20)         NOT NULL,
    TenSanPham      VARCHAR(200)        NOT NULL,
    MaNhomHang      VARCHAR(20)         NOT NULL,
    ThuongHieu      VARCHAR(100),
    MoTa            TEXT,
    GiaBanMacDinh   NUMERIC(15,2)       NOT NULL DEFAULT 0,
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_SanPham   PRIMARY KEY (MaSanPham),
    CONSTRAINT FK_SP_NhomHang FOREIGN KEY (MaNhomHang)
        REFERENCES NHOMHANG (MaNhomHang)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE THUOCTINH (
    MaThuocTinh     VARCHAR(20)         NOT NULL,
    LoaiThuocTinh   loai_thuoc_tinh     NOT NULL,
    GiaTri          VARCHAR(50)         NOT NULL,
    MoTa            TEXT,
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_ThuocTinh PRIMARY KEY (MaThuocTinh)
);

CREATE TABLE BIENTHESANPHAM (
    MaBienThe               VARCHAR(20)         NOT NULL,
    MaSanPham               VARCHAR(20)         NOT NULL,
    MaThuocTinhKichThuoc    VARCHAR(20)         NOT NULL,
    MaThuocTinhMauSac       VARCHAR(20)         NOT NULL,
    SKU                     VARCHAR(50)         NOT NULL,
    DonViTinh               VARCHAR(20)         NOT NULL DEFAULT 'Cái',
    GiaVon                  NUMERIC(15,2)       NOT NULL DEFAULT 0,
    GiaBan                  NUMERIC(15,2)       NOT NULL DEFAULT 0,
    SuDungGiaMacDinh        BOOLEAN             NOT NULL DEFAULT TRUE,
    TrangThai               trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_BienThe   PRIMARY KEY (MaBienThe),
    CONSTRAINT UQ_SKU        UNIQUE (SKU),
    CONSTRAINT FK_BT_SanPham FOREIGN KEY (MaSanPham)
        REFERENCES SANPHAM (MaSanPham)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_BT_KichThuoc FOREIGN KEY (MaThuocTinhKichThuoc)
        REFERENCES THUOCTINH (MaThuocTinh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_BT_MauSac FOREIGN KEY (MaThuocTinhMauSac)
        REFERENCES THUOCTINH (MaThuocTinh)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


 
-- NHÓM 2: KHO HÀNG
 

CREATE TABLE CHINHANH (
    MaChiNhanh      VARCHAR(20)         NOT NULL,
    TenChiNhanh     VARCHAR(150)        NOT NULL,
    LoaiChiNhanh    loai_chi_nhanh      NOT NULL,
    DiaChi          TEXT,
    SoDienThoai     VARCHAR(15),
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_ChiNhanh PRIMARY KEY (MaChiNhanh)
);

CREATE TABLE NHACUNGCAP (
    MaNhaCungCap    VARCHAR(20)         NOT NULL,
    TenNhaCungCap   VARCHAR(200)        NOT NULL,
    SoDienThoai     VARCHAR(15),
    Email           VARCHAR(100),
    DiaChi          TEXT,
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_NhaCungCap PRIMARY KEY (MaNhaCungCap)
);

CREATE TABLE PHIEUNHAP (
    MaPhieuNhap     VARCHAR(20)                 NOT NULL,
    MaNhaCungCap    VARCHAR(20)                 NOT NULL,
    MaChiNhanh      VARCHAR(20)                 NOT NULL,
    NguoiTao        VARCHAR(20)                 NOT NULL,
    NguoiDuyet      VARCHAR(20),
    NgayNhap        TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai       trang_thai_phieu_nhap       NOT NULL DEFAULT 'CHO_DUYET',
    GhiChu          TEXT,
    CONSTRAINT PK_PhieuNhap     PRIMARY KEY (MaPhieuNhap),
    CONSTRAINT FK_PN_NhaCungCap FOREIGN KEY (MaNhaCungCap)
        REFERENCES NHACUNGCAP (MaNhaCungCap)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PN_ChiNhanh   FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE CT_PHIEUNHAP (
    MaPhieuNhap     VARCHAR(20)         NOT NULL,
    MaBienThe       VARCHAR(20)         NOT NULL,
    SoLuongNhap     INT                 NOT NULL CHECK (SoLuongNhap > 0),
    DonGiaNhap      NUMERIC(15,2)       NOT NULL CHECK (DonGiaNhap >= 0),
    ThanhTien       NUMERIC(15,2)       GENERATED ALWAYS AS (SoLuongNhap * DonGiaNhap) STORED,
    CONSTRAINT PK_CT_PhieuNhap  PRIMARY KEY (MaPhieuNhap, MaBienThe),
    CONSTRAINT FK_CTPN_PhieuNhap FOREIGN KEY (MaPhieuNhap)
        REFERENCES PHIEUNHAP (MaPhieuNhap)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CTPN_BienThe  FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE TONKHO (
    MaChiNhanh          VARCHAR(20)     NOT NULL,
    MaBienThe           VARCHAR(20)     NOT NULL,
    SoLuongTon          INT             NOT NULL DEFAULT 0 CHECK (SoLuongTon >= 0),
    DinhMucToiThieu     INT             NOT NULL DEFAULT 0,
    DinhMucToiDa        INT             NOT NULL DEFAULT 9999,
    LanCapNhatCuoi      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_TonKho    PRIMARY KEY (MaChiNhanh, MaBienThe),
    CONSTRAINT FK_TK_ChiNhanh  FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_TK_BienThe   FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CHK_DinhMuc CHECK (DinhMucToiThieu <= DinhMucToiDa)
);

CREATE TABLE LICHSUTONKHO (
    MaLichSu            SERIAL              NOT NULL,
    MaChiNhanh          VARCHAR(20)         NOT NULL,
    MaBienThe           VARCHAR(20)         NOT NULL,
    LoaiGiaoDich        loai_giao_dich_kho  NOT NULL,
    LoaiThamChieu       loai_tham_chieu_kho,
    MaThamChieu         VARCHAR(20),
    SoLuongThayDoi      INT                 NOT NULL,
    SoLuongSauThayDoi   INT                 NOT NULL,
    NguoiThucHien       VARCHAR(20),
    ThoiGian            TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    GhiChu              TEXT,
    CONSTRAINT PK_LichSuTonKho PRIMARY KEY (MaLichSu),
    CONSTRAINT FK_LS_ChiNhanh  FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_LS_BienThe   FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE PHIEUCHUYEN (
    MaPhieuChuyen   VARCHAR(20)                 NOT NULL,
    ChiNhanhDi      VARCHAR(20)                 NOT NULL,
    ChiNhanhDen     VARCHAR(20)                 NOT NULL,
    NguoiTao        VARCHAR(20)                 NOT NULL,
    NguoiDuyet      VARCHAR(20),
    NgayChuyen      TIMESTAMP,
    NgayNhan        TIMESTAMP,
    TrangThai       trang_thai_phieu_chuyen     NOT NULL DEFAULT 'CHO_DUYET',
    GhiChu          TEXT,
    CONSTRAINT PK_PhieuChuyen   PRIMARY KEY (MaPhieuChuyen),
    CONSTRAINT FK_PC_ChiNhanhDi FOREIGN KEY (ChiNhanhDi)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_PC_ChiNhanhDen FOREIGN KEY (ChiNhanhDen)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT CHK_PC_KhacNhau CHECK (ChiNhanhDi <> ChiNhanhDen)
);

CREATE TABLE CT_PHIEUCHUYEN (
    MaPhieuChuyen   VARCHAR(20)     NOT NULL,
    MaBienThe       VARCHAR(20)     NOT NULL,
    SoLuongChuyen   INT             NOT NULL CHECK (SoLuongChuyen > 0),
    SoLuongNhan     INT             NOT NULL DEFAULT 0 CHECK (SoLuongNhan >= 0),
    CONSTRAINT PK_CT_PhieuChuyen    PRIMARY KEY (MaPhieuChuyen, MaBienThe),
    CONSTRAINT FK_CTPC_PhieuChuyen  FOREIGN KEY (MaPhieuChuyen)
        REFERENCES PHIEUCHUYEN (MaPhieuChuyen)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CTPC_BienThe      FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE PHIEUKIEMKHO (
    MaPhieuKiemKho  VARCHAR(20)             NOT NULL,
    MaChiNhanh      VARCHAR(20)             NOT NULL,
    NguoiTao        VARCHAR(20)             NOT NULL,
    NguoiCanBang    VARCHAR(20),
    NgayTao         TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NgayCanBang     TIMESTAMP,
    TrangThai       trang_thai_kiem_kho     NOT NULL DEFAULT 'DANG_KIEM',
    GhiChu          TEXT,
    CONSTRAINT PK_PhieuKiemKho  PRIMARY KEY (MaPhieuKiemKho),
    CONSTRAINT FK_PKK_ChiNhanh  FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE CT_PHIEUKIEMKHO (
    MaPhieuKiemKho  VARCHAR(20)     NOT NULL,
    MaBienThe       VARCHAR(20)     NOT NULL,
    SoLuongHeThong  INT             NOT NULL DEFAULT 0,
    SoLuongThucTe  INT              NOT NULL DEFAULT 0,
    SoLuongChenhLech INT            GENERATED ALWAYS AS (SoLuongThucTe - SoLuongHeThong) STORED,
    CONSTRAINT PK_CT_PhieuKiemKho   PRIMARY KEY (MaPhieuKiemKho, MaBienThe),
    CONSTRAINT FK_CTPKK_PhieuKK     FOREIGN KEY (MaPhieuKiemKho)
        REFERENCES PHIEUKIEMKHO (MaPhieuKiemKho)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CTPKK_BienThe     FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


 
-- NHÓM 3: NGƯỜI DÙNG VÀ PHÂN QUYỀN
 

CREATE TABLE VAITRO (
    MaVaiTro        VARCHAR(20)     NOT NULL,
    TenVaiTro       VARCHAR(100)    NOT NULL,
    MoTa            TEXT,
    CONSTRAINT PK_VaiTro PRIMARY KEY (MaVaiTro)
);

CREATE TABLE NGUOIDUNG (
    MaNguoiDung     VARCHAR(20)         NOT NULL,
    HoTen           VARCHAR(150)        NOT NULL,
    TenDangNhap     VARCHAR(50)         NOT NULL,
    MatKhau         VARCHAR(255)        NOT NULL,
    SoDienThoai     VARCHAR(15),
    MaVaiTro        VARCHAR(20)         NOT NULL,
    MaChiNhanh      VARCHAR(20),
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_NguoiDung     PRIMARY KEY (MaNguoiDung),
    CONSTRAINT UQ_TenDangNhap   UNIQUE (TenDangNhap),
    CONSTRAINT FK_ND_VaiTro     FOREIGN KEY (MaVaiTro)
        REFERENCES VAITRO (MaVaiTro)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_ND_ChiNhanh   FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE SET NULL
);


 
-- NHÓM 4: BÁN HÀNG ĐA KÊNH
 

CREATE TABLE KENHBANHANG (
    MaKenh      VARCHAR(20)         NOT NULL,
    TenKenh     VARCHAR(100)        NOT NULL,
    LoaiKenh    loai_kenh_banhang   NOT NULL,
    TrangThai   trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_KenhBanHang PRIMARY KEY (MaKenh)
);

CREATE TABLE KHACHHANG (
    MaKhachHang     VARCHAR(20)         NOT NULL,
    HoTen           VARCHAR(150)        NOT NULL,
    SoDienThoai     VARCHAR(15),
    Email           VARCHAR(100),
    DiaChi          TEXT,
    TrangThai       trang_thai_chung    NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT PK_KhachHang PRIMARY KEY (MaKhachHang)
);

CREATE TABLE DONHANG (
    MaDonHang           VARCHAR(20)                 NOT NULL,
    MaKenh              VARCHAR(20)                 NOT NULL,
    MaKhachHang         VARCHAR(20)                 NOT NULL,
    MaChiNhanhXuLy      VARCHAR(20)                 NOT NULL,
    NguoiTao            VARCHAR(20)                 NOT NULL,
    NgayDat             TIMESTAMP                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThaiDonHang    trang_thai_don_hang         NOT NULL DEFAULT 'CHO_XAC_NHAN',
    TrangThaiThanhToan  trang_thai_thanh_toan       NOT NULL DEFAULT 'CHUA_THANH_TOAN',
    PhuongThucThanhToan phuong_thuc_thanh_toan      NOT NULL DEFAULT 'TIEN_MAT',
    TongTien            NUMERIC(15,2)               NOT NULL DEFAULT 0,
    GhiChu              TEXT,
    CONSTRAINT PK_DonHang       PRIMARY KEY (MaDonHang),
    CONSTRAINT FK_DH_Kenh       FOREIGN KEY (MaKenh)
        REFERENCES KENHBANHANG (MaKenh)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_DH_KhachHang  FOREIGN KEY (MaKhachHang)
        REFERENCES KHACHHANG (MaKhachHang)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_DH_ChiNhanh   FOREIGN KEY (MaChiNhanhXuLy)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE CT_DONHANG (
    MaDonHang       VARCHAR(20)     NOT NULL,
    MaBienThe       VARCHAR(20)     NOT NULL,
    SoLuongDat      INT             NOT NULL CHECK (SoLuongDat > 0),
    DonGia          NUMERIC(15,2)   NOT NULL CHECK (DonGia >= 0),
    ThanhTien       NUMERIC(15,2)   GENERATED ALWAYS AS (SoLuongDat * DonGia) STORED,
    CONSTRAINT PK_CT_DonHang    PRIMARY KEY (MaDonHang, MaBienThe),
    CONSTRAINT FK_CTDH_DonHang  FOREIGN KEY (MaDonHang)
        REFERENCES DONHANG (MaDonHang)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CTDH_BienThe  FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE HOADON (
    MaHoaDon    VARCHAR(20)             NOT NULL,
    MaDonHang   VARCHAR(20)             NOT NULL,
    MaChiNhanh  VARCHAR(20)             NOT NULL,
    NguoiTao    VARCHAR(20)             NOT NULL,
    NgayLap     TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTien    NUMERIC(15,2)           NOT NULL DEFAULT 0,
    TrangThai   trang_thai_hoa_don      NOT NULL DEFAULT 'NHAP',
    GhiChu      TEXT,
    CONSTRAINT PK_HoaDon        PRIMARY KEY (MaHoaDon),
    CONSTRAINT UQ_HD_DonHang    UNIQUE (MaDonHang),
    CONSTRAINT FK_HD_DonHang    FOREIGN KEY (MaDonHang)
        REFERENCES DONHANG (MaDonHang)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_HD_ChiNhanh   FOREIGN KEY (MaChiNhanh)
        REFERENCES CHINHANH (MaChiNhanh)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE CT_HOADON (
    MaHoaDon        VARCHAR(20)     NOT NULL,
    MaBienThe       VARCHAR(20)     NOT NULL,
    SoLuongBan      INT             NOT NULL CHECK (SoLuongBan > 0),
    DonGiaBan       NUMERIC(15,2)   NOT NULL CHECK (DonGiaBan >= 0),
    ThanhTien       NUMERIC(15,2)   GENERATED ALWAYS AS (SoLuongBan * DonGiaBan) STORED,
    CONSTRAINT PK_CT_HoaDon     PRIMARY KEY (MaHoaDon, MaBienThe),
    CONSTRAINT FK_CTHD_HoaDon   FOREIGN KEY (MaHoaDon)
        REFERENCES HOADON (MaHoaDon)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_CTHD_BienThe  FOREIGN KEY (MaBienThe)
        REFERENCES BIENTHESANPHAM (MaBienThe)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

