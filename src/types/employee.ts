export interface Employee {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  department: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Public safe view type that omits sensitive information like mobile number
export interface PublicEmployee {
  id: string;
  name: string;
  department: string | null;
}

export type HostSelection =
  | {
      type: "employee";
      employeeId: string;
    }
  | {
      type: "department";
      departmentCode: "HR";
    };

export type HostNotificationCapability = {
  selectionType: "employee" | "department";
  employeeId?: string;
  displayName: string;
  hasMobile: boolean;
  normalizedMobile: string | null;
  hasEmail: boolean;
  employeeEmail: string | null;
  notificationMode: "push" | "email" | "whatsapp" | "manual";
};

export type ApprovalNotificationData = {
  visitorName: string;
  visitorMobile: string;
  purpose: string;
  meetingTarget: string;
  employeeId?: string;
  notificationMode: "push" | "email" | "whatsapp" | "manual";
  destinationMobile?: string | null;
  destinationEmail?: string | null;
  visitorPhotoPath: string;
};
