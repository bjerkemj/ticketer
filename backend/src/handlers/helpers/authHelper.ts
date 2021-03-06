import { User } from '@prisma/client';
import { Context } from '../../context';
import { LoginRequest, RestResponse, TokenRestResponse } from '../../types';
import { generateToken } from '../../util/authUtil';

// eslint-disable-next-line max-len
export const loginHelper = async (
  request: LoginRequest,
  ctx: Context,
): Promise<RestResponse | TokenRestResponse> => {
  const user: void | User | null = await ctx.prisma.user.findUnique({
    where: {
      email: request.email,
    },
  }).catch(() => null);

  console.log(user);

  if (user === null || !(user instanceof Object) || !('id' in user))
    return { code: 401, message: 'User not found' };
  if (request.password !== user.password)
    return { code: 401, message: 'Wrong password' };

  const token = await generateToken(user);

  return ctx.prisma.token
    .upsert({
      where: {
        ownerId: user.id,
      },
      update: {
        token,
      },
      create: {
        token,
        ownerId: user.id,
      },
    }).then((data) => ({
      code: 200,
      message: data,
    }))
    .catch(() => ({ code: 400, message: 'Something went wrong!' }));
};
