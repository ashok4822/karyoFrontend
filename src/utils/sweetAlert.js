import Swal from 'sweetalert2';

// Success alert
export const showSuccessAlert = (title, message) => {
  return Swal.fire({
    title: title || 'Success!',
    text: message,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error alert
export const showErrorAlert = (title, message) => {
  return Swal.fire({
    title: title || 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK',
  });
};

// Warning alert
export const showWarningAlert = (title, message) => {
  return Swal.fire({
    title: title || 'Warning!',
    text: message,
    icon: 'warning',
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'OK',
  });
};

// Info alert
export const showInfoAlert = (title, message) => {
  return Swal.fire({
    title: title || 'Information',
    text: message,
    icon: 'info',
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
  });
};

// Confirmation dialog
export const showConfirmDialog = (title, message, confirmText = 'Yes', cancelText = 'No') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

// Delete confirmation dialog
export const showDeleteConfirmDialog = (title, message) => {
  return Swal.fire({
    title: title || 'Are you sure?',
    text: message || "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });
};

// Input dialog
export const showInputDialog = (title, message, placeholder = '') => {
  return Swal.fire({
    title: title,
    text: message,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!';
      }
    },
  });
};

// Textarea dialog
export const showTextareaDialog = (title, message, placeholder = '') => {
  return Swal.fire({
    title: title,
    text: message,
    input: 'textarea',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!';
      }
    },
  });
};

// Loading alert
export const showLoadingAlert = (title = 'Loading...') => {
  return Swal.fire({
    title: title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading alert
export const closeLoadingAlert = () => {
  Swal.close();
};

// Toast notification
export const showToast = (message, type = 'success') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}; 