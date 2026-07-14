// Only this email can access screener feature
export const ADMIN_EMAIL = 'jobinsc@gmail.com';

export const isAdmin = (user) => {
  if (!user) return false;
  return user.email === ADMIN_EMAIL;
};