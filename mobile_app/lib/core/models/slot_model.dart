class SlotModel {
  final int slotNumber;
  final String status;
  final String? userPhone;
  final DateTime? chargingEndsAt;

  SlotModel({
    required this.slotNumber,
    required this.status,
    this.userPhone,
    this.chargingEndsAt,
  });

  factory SlotModel.fromJson(Map<String, dynamic> json) {
    return SlotModel(
      slotNumber: json['slot_number'],
      status: json['status'],
      userPhone: json['user_phone'],
      chargingEndsAt: json['charging_ends_at'] != null 
          ? DateTime.parse(json['charging_ends_at']) 
          : null,
    );
  }
}
