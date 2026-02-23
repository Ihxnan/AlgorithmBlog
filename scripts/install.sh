#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[0;1m'
NC='\033[0;0m'

echo -e "${BLUE}=== Arch Linux 自动化安装脚本 ===${NC}"

if [[ ! -d /run/archiso ]]; then
    echo -e "${RED}错误：请在Arch Linux ISO启动环境中运行此脚本！${NC}"
    exit 1
fi

if ! ping -c 1 -W 2 ping.archlinux.org >/dev/null 2>&1; then
    echo -e "${RED}错误：未检测到网络连接！${NC}"
    echo -e "${YELLOW}请确保已连接网络后再运行此脚本。${NC}"
    echo -e "${YELLOW}可以使用 'iwctl' 连接 WiFi 或 'ip link' 检查网络接口。${NC}"
    exit 1
fi

read -p "目标磁盘 (默认: /dev/sda): " DISK_INPUT
DISK="${DISK_INPUT:-/dev/sda}"

read -p "主机名 (默认: archlinux): " HOSTNAME_INPUT
HOSTNAME="${HOSTNAME_INPUT:-archlinux}"

while [[ -z "$USERNAME_INPUT" ]]; do
    echo -n -e "用户名 (${BOLD}必填${NC}): "
    read USERNAME_INPUT
    if [[ -z "$USERNAME_INPUT" ]]; then
        echo -e "${RED}错误：用户名不能为空！${NC}"
    fi
done
USERNAME="$USERNAME_INPUT"

while [[ -z "$PASSWORD_INPUT" ]]; do
    echo -n -e "密码 (${BOLD}必填${NC}): "
    read -s PASSWORD_INPUT
    echo
    if [[ -z "$PASSWORD_INPUT" ]]; then
        echo -e "${RED}错误：密码不能为空！${NC}"
    fi
done
PASSWORD="$PASSWORD_INPUT"

read -p "时区 (默认: Asia/Shanghai): " TIMEZONE_INPUT
TIMEZONE="${TIMEZONE_INPUT:-Asia/Shanghai}"

read -p "是否添加中文语言环境 zh_CN.UTF-8? (y/N): " ADD_ZH_CN

echo -e "\n${BLUE}=== 配置确认 ===${NC}"
echo -e "目标磁盘: ${YELLOW}$DISK${NC}"
echo -e "主机名: ${YELLOW}$HOSTNAME${NC}"
echo -e "用户名: ${YELLOW}$USERNAME${NC}"
echo -e "时区: ${YELLOW}$TIMEZONE${NC}"
echo -e "语言环境: ${YELLOW}en_US.UTF-8${NC}"
if [[ $ADD_ZH_CN == [Yy] ]]; then
    echo -e "添加中文支持: ${YELLOW}是${NC}"
else
    echo -e "添加中文支持: ${YELLOW}否${NC}"
fi

echo -e "\n${RED}=== 警告：本脚本会格式化 $DISK，所有数据将被清除！ ===${NC}"
read -p "确认继续？(y/N) " confirm
if [[ $confirm != [Yy] ]]; then
    echo -e "${RED}安装已取消。${NC}"
    exit 1
fi

echo -e "${BLUE}=== 开始分区 $DISK ===${NC}"

sgdisk --zap $DISK

sgdisk -n 1:0:+1G -t 1:ef00 -c 1:"EFI" $DISK
sgdisk -n 2:0:0 -t 2:8300 -c 2:"ROOT" $DISK

partprobe $DISK

echo -e "${BLUE}=== 格式化分区 ===${NC}"
mkfs.fat -F32 ${DISK}1
mkfs.btrfs -f ${DISK}2

echo -e "${BLUE}=== 挂载分区 ===${NC}"
mount ${DISK}2 /mnt
mount --mkdir ${DISK}1 /mnt/boot

echo -e "${GREEN}=== 安装基础系统 ===${NC}"

reflector -a 12 -c cn -f 10 --sort rate --save /etc/pacman.d/mirrorlist

pacstrap -K /mnt base linux-zen linux-firmware grub efibootmgr networkmanager sudo vim

echo -e "${GREEN}=== 生成fstab ===${NC}"
genfstab -U /mnt >>/mnt/etc/fstab

echo -e "${GREEN}=== 配置系统 ===${NC}"
arch-chroot /mnt /bin/bash -c "
    ln -sf /usr/share/zoneinfo/$TIMEZONE /etc/localtime
    hwclock --systohc

    sed -i 's/^#en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen
    if [[ $ADD_ZH_CN == [Yy] ]]; then
        sed -i 's/^#zh_CN.UTF-8/zh_CN.UTF-8/' /etc/locale.gen
    fi
    echo 'LANG=en_US.UTF-8' > /etc/locale.conf
    locale-gen

    echo $HOSTNAME > /etc/hostname

    echo "root:$PASSWORD" | chpasswd

    useradd -m -G wheel $USERNAME
    echo "$USERNAME:$PASSWORD" | chpasswd

    sed -i 's/^# %wheel ALL=(ALL:ALL) ALL/%wheel ALL=(ALL:ALL) ALL/' /etc/sudoers

    grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=ArchLinux
    grub-mkconfig -o /boot/grub/grub.cfg

    systemctl enable NetworkManager
"

echo -e "${YELLOW}=== 安装完成 ===${NC}"
umount -R /mnt
echo -e "${YELLOW}请重启系统（执行 reboot 命令），移除ISO镜像后即可进入新安装的Arch系统！${NC}"
