-- Thủ tục 1: Duyệt phiếu nhập hàng
CREATE OR REPLACE PROCEDURE sp_DuyetPhieuNhap(
    p_MaPhieuNhap   VARCHAR(20),
    p_NguoiDuyet    VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_MaChiNhanh    VARCHAR(20);
    v_TrangThai     VARCHAR(20);
    v_MaBienThe     VARCHAR(20);
    v_SoLuongNhap   INT;
    v_SoLuongHienTai INT;

    cur_ChiTiet CURSOR FOR
        SELECT MaBienThe, SoLuongNhap
        FROM CT_PHIEUNHAP
        WHERE MaPhieuNhap = p_MaPhieuNhap;
BEGIN
    -- Kiểm tra phiếu nhập tồn tại và đang ở trạng thái chờ duyệt
    SELECT MaChiNhanh, TrangThai
    INTO v_MaChiNhanh, v_TrangThai
    FROM PHIEUNHAP
    WHERE MaPhieuNhap = p_MaPhieuNhap;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Phiếu nhập % không tồn tại.', p_MaPhieuNhap;
    END IF;

    IF v_TrangThai <> 'CHO_DUYET' THEN
        RAISE EXCEPTION 'Phiếu nhập % không ở trạng thái chờ duyệt.', p_MaPhieuNhap;
    END IF;

    -- Cập nhật trạng thái phiếu nhập
    UPDATE PHIEUNHAP
    SET TrangThai   = 'DA_DUYET',
        NguoiDuyet  = p_NguoiDuyet,
        NgayNhap    = CURRENT_TIMESTAMP
    WHERE MaPhieuNhap = p_MaPhieuNhap;

    -- Duyệt từng dòng chi tiết phiếu nhập
    OPEN cur_ChiTiet;
    LOOP
        FETCH cur_ChiTiet INTO v_MaBienThe, v_SoLuongNhap;
        EXIT WHEN NOT FOUND;

        -- Kiểm tra tồn kho đã có bản ghi chưa
        SELECT SoLuongTon INTO v_SoLuongHienTai
        FROM TONKHO
        WHERE MaChiNhanh = v_MaChiNhanh
          AND MaBienThe  = v_MaBienThe;

        IF NOT FOUND THEN
            -- Chưa có: tạo mới bản ghi tồn kho
            INSERT INTO TONKHO(MaChiNhanh, MaBienThe, SoLuongTon, LanCapNhatCuoi)
            VALUES (v_MaChiNhanh, v_MaBienThe, v_SoLuongNhap, CURRENT_TIMESTAMP);
            v_SoLuongHienTai := v_SoLuongNhap;
        ELSE
            -- Đã có: cộng thêm số lượng nhập
            UPDATE TONKHO
            SET SoLuongTon    = SoLuongTon + v_SoLuongNhap,
                LanCapNhatCuoi = CURRENT_TIMESTAMP
            WHERE MaChiNhanh = v_MaChiNhanh
              AND MaBienThe  = v_MaBienThe;
            v_SoLuongHienTai := v_SoLuongHienTai + v_SoLuongNhap;
        END IF;

        -- Ghi lịch sử biến động tồn kho
        INSERT INTO LICHSUTONKHO(
            MaChiNhanh, MaBienThe, LoaiGiaoDich,
            LoaiThamChieu, MaThamChieu,
            SoLuongThayDoi, SoLuongSauThayDoi,
            NguoiThucHien, ThoiGian, GhiChu
        )
        VALUES (
            v_MaChiNhanh, v_MaBienThe, 'NHAP_HANG',
            'PHIEU_NHAP', p_MaPhieuNhap,
            v_SoLuongNhap, v_SoLuongHienTai,
            p_NguoiDuyet, CURRENT_TIMESTAMP,
            'Duyệt phiếu nhập ' || p_MaPhieuNhap
        );
    END LOOP;
    CLOSE cur_ChiTiet;

    RAISE NOTICE 'Phiếu nhập % đã được duyệt thành công.', p_MaPhieuNhap;
END;
$$;
Cách gọi:
CALL sp_DuyetPhieuNhap('PN2024001', 'NV001');

-- Thủ tục 2: Xác nhận nhận hàng phiếu chuyển
CREATE OR REPLACE PROCEDURE sp_XacNhanNhanHang(
    p_MaPhieuChuyen VARCHAR(20),
    p_NguoiNhan     VARCHAR(20),
    p_SoLuongNhan   INT[]   -- Mảng số lượng nhận thực tế theo thứ tự dòng CT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_ChiNhanhDi    VARCHAR(20);
    v_ChiNhanhDen   VARCHAR(20);
    v_TrangThai     VARCHAR(20);
    v_MaBienThe     VARCHAR(20);
    v_SoLuongChuyen INT;
    v_SoLuongNhan   INT;
    v_idx           INT := 1;

    cur_ChiTiet CURSOR FOR
        SELECT MaBienThe, SoLuongChuyen
        FROM CT_PHIEUCHUYEN
        WHERE MaPhieuChuyen = p_MaPhieuChuyen
        ORDER BY MaBienThe;
BEGIN
    SELECT ChiNhanhDi, ChiNhanhDen, TrangThai
    INTO v_ChiNhanhDi, v_ChiNhanhDen, v_TrangThai
    FROM PHIEUCHUYEN
    WHERE MaPhieuChuyen = p_MaPhieuChuyen;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Phiếu chuyển % không tồn tại.', p_MaPhieuChuyen;
    END IF;

    IF v_TrangThai <> 'DANG_VAN_CHUYEN' THEN
        RAISE EXCEPTION 'Phiếu chuyển % không ở trạng thái đang vận chuyển.', p_MaPhieuChuyen;
    END IF;

    OPEN cur_ChiTiet;
    LOOP
        FETCH cur_ChiTiet INTO v_MaBienThe, v_SoLuongChuyen;
        EXIT WHEN NOT FOUND;

        v_SoLuongNhan := p_SoLuongNhan[v_idx];

        -- Cập nhật số lượng nhận thực tế
        UPDATE CT_PHIEUCHUYEN
        SET SoLuongNhan = v_SoLuongNhan
        WHERE MaPhieuChuyen = p_MaPhieuChuyen
          AND MaBienThe     = v_MaBienThe;

        -- Trừ tồn kho chi nhánh đi
        UPDATE TONKHO
        SET SoLuongTon     = SoLuongTon - v_SoLuongChuyen,
            LanCapNhatCuoi = CURRENT_TIMESTAMP
        WHERE MaChiNhanh = v_ChiNhanhDi
          AND MaBienThe  = v_MaBienThe;

        -- Cộng tồn kho chi nhánh đến
        INSERT INTO TONKHO(MaChiNhanh, MaBienThe, SoLuongTon, LanCapNhatCuoi)
        VALUES (v_ChiNhanhDen, v_MaBienThe, v_SoLuongNhan, CURRENT_TIMESTAMP)
        ON CONFLICT (MaChiNhanh, MaBienThe)
        DO UPDATE SET SoLuongTon     = TONKHO.SoLuongTon + v_SoLuongNhan,
                      LanCapNhatCuoi = CURRENT_TIMESTAMP;

        -- Ghi lịch sử cho chi nhánh đi
        INSERT INTO LICHSUTONKHO(
            MaChiNhanh, MaBienThe, LoaiGiaoDich,
            LoaiThamChieu, MaThamChieu,
            SoLuongThayDoi, SoLuongSauThayDoi,
            NguoiThucHien, ThoiGian, GhiChu
        )
        SELECT v_ChiNhanhDi, v_MaBienThe, 'XUAT_CHUYEN',
               'PHIEU_CHUYEN', p_MaPhieuChuyen,
               -v_SoLuongChuyen, SoLuongTon,
               p_NguoiNhan, CURRENT_TIMESTAMP,
               'Xuất chuyển kho theo phiếu ' || p_MaPhieuChuyen
        FROM TONKHO
        WHERE MaChiNhanh = v_ChiNhanhDi AND MaBienThe = v_MaBienThe;

        -- Ghi lịch sử cho chi nhánh đến
        INSERT INTO LICHSUTONKHO(
            MaChiNhanh, MaBienThe, LoaiGiaoDich,
            LoaiThamChieu, MaThamChieu,
            SoLuongThayDoi, SoLuongSauThayDoi,
            NguoiThucHien, ThoiGian, GhiChu
        )
        SELECT v_ChiNhanhDen, v_MaBienThe, 'NHAP_CHUYEN',
               'PHIEU_CHUYEN', p_MaPhieuChuyen,
               v_SoLuongNhan, SoLuongTon,
               p_NguoiNhan, CURRENT_TIMESTAMP,
               'Nhập chuyển kho theo phiếu ' || p_MaPhieuChuyen
        FROM TONKHO
        WHERE MaChiNhanh = v_ChiNhanhDen AND MaBienThe = v_MaBienThe;

        v_idx := v_idx + 1;
    END LOOP;
    CLOSE cur_ChiTiet;

    -- Cập nhật trạng thái phiếu chuyển
    UPDATE PHIEUCHUYEN
    SET TrangThai = 'HOAN_THANH',
        NgayNhan  = CURRENT_TIMESTAMP
    WHERE MaPhieuChuyen = p_MaPhieuChuyen;

    RAISE NOTICE 'Xác nhận nhận hàng phiếu chuyển % thành công.', p_MaPhieuChuyen;
END;
$$;
-- Thu tục 3: Cân bằng kho theo phiếu kiểm kho
CREATE OR REPLACE PROCEDURE sp_CanBangKho(
    p_MaPhieuKiemKho    VARCHAR(20),
    p_NguoiCanBang      VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_MaChiNhanh    VARCHAR(20);
    v_TrangThai     VARCHAR(20);
    v_MaBienThe     VARCHAR(20);
    v_SoLuongThucTe INT;
    v_SoLuongHienTai INT;
    v_ChenhLech     INT;

    cur_KiemKho CURSOR FOR
        SELECT MaBienThe, SoLuongThucTe
        FROM CT_PHIEUKIEMKHO
        WHERE MaPhieuKiemKho = p_MaPhieuKiemKho;
BEGIN
    SELECT MaChiNhanh, TrangThai
    INTO v_MaChiNhanh, v_TrangThai
    FROM PHIEUKIEMKHO
    WHERE MaPhieuKiemKho = p_MaPhieuKiemKho;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Phiếu kiểm kho % không tồn tại.', p_MaPhieuKiemKho;
    END IF;

    IF v_TrangThai <> 'CHO_CAN_BANG' THEN
        RAISE EXCEPTION 'Phiếu kiểm kho % chưa sẵn sàng để cân bằng.', p_MaPhieuKiemKho;
    END IF;

    OPEN cur_KiemKho;
    LOOP
        FETCH cur_KiemKho INTO v_MaBienThe, v_SoLuongThucTe;
        EXIT WHEN NOT FOUND;

        SELECT SoLuongTon INTO v_SoLuongHienTai
        FROM TONKHO
        WHERE MaChiNhanh = v_MaChiNhanh
          AND MaBienThe  = v_MaBienThe;

        v_ChenhLech := v_SoLuongThucTe - v_SoLuongHienTai;

        -- Cập nhật lại tồn kho về số thực tế
        UPDATE TONKHO
        SET SoLuongTon     = v_SoLuongThucTe,
            LanCapNhatCuoi = CURRENT_TIMESTAMP
        WHERE MaChiNhanh = v_MaChiNhanh
          AND MaBienThe  = v_MaBienThe;

        -- Cập nhật chênh lệch vào chi tiết phiếu
        UPDATE CT_PHIEUKIEMKHO
        SET SoLuongChenhLech = v_ChenhLech
        WHERE MaPhieuKiemKho = p_MaPhieuKiemKho
          AND MaBienThe      = v_MaBienThe;

        -- Ghi lịch sử điều chỉnh
        IF v_ChenhLech <> 0 THEN
            INSERT INTO LICHSUTONKHO(
                MaChiNhanh, MaBienThe, LoaiGiaoDich,
                LoaiThamChieu, MaThamChieu,
                SoLuongThayDoi, SoLuongSauThayDoi,
                NguoiThucHien, ThoiGian, GhiChu
            )
            VALUES (
                v_MaChiNhanh, v_MaBienThe, 'DIEU_CHINH_KIEM_KHO',
                'PHIEU_KIEM_KHO', p_MaPhieuKiemKho,
                v_ChenhLech, v_SoLuongThucTe,
                p_NguoiCanBang, CURRENT_TIMESTAMP,
                'Cân bằng kho theo phiếu kiểm ' || p_MaPhieuKiemKho
            );
        END IF;
    END LOOP;
    CLOSE cur_KiemKho;

    UPDATE PHIEUKIEMKHO
    SET TrangThai    = 'DA_CAN_BANG',
        NguoiCanBang = p_NguoiCanBang,
        NgayCanBang  = CURRENT_TIMESTAMP
    WHERE MaPhieuKiemKho = p_MaPhieuKiemKho;

    RAISE NOTICE 'Cân bằng kho theo phiếu % hoàn tất.', p_MaPhieuKiemKho;
END;
$$;
