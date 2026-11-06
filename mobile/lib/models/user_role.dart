enum UserRole {
  parent,
  driver,
  assistant,
  admin;

  static UserRole fromString(String? role) {
    switch (role?.toLowerCase().trim()) {
      case 'driver':
        return UserRole.driver;
      case 'assistant':
        return UserRole.assistant;
      case 'admin':
        return UserRole.admin;
      case 'parent':
      default:
        return UserRole.parent;
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.parent:
        return 'Parent / Guardian';
      case UserRole.driver:
        return 'School Van Driver';
      case UserRole.assistant:
        return 'Driver Assistant';
      case UserRole.admin:
        return 'Fleet Administrator';
    }
  }

  String get shortName {
    switch (this) {
      case UserRole.parent:
        return 'Parent';
      case UserRole.driver:
        return 'Driver';
      case UserRole.assistant:
        return 'Assistant';
      case UserRole.admin:
        return 'Admin';
    }
  }

  String get apiValue {
    switch (this) {
      case UserRole.parent:
        return 'parent';
      case UserRole.driver:
        return 'driver';
      case UserRole.assistant:
        return 'assistant';
      case UserRole.admin:
        return 'admin';
    }
  }
}
