import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IamService } from './iam.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('iam')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'iam', version: '1' })
export class IamController {
  constructor(private readonly iamService: IamService) {}

  // ─── Users ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a new user' })
  @Post('users')
  createUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateUserDto,
  ) {
    return this.iamService.createUser(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all users in the organization' })
  @Get('users')
  findUsers(@CurrentUser() user: CurrentUserPayload) {
    return this.iamService.findUsers(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @Get('users/:id')
  findUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.iamService.findUser(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a user' })
  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.iamService.updateUser(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Soft-delete a user' })
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.iamService.deleteUser(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Change own password' })
  @Post('users/:id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.iamService.changePassword(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Admin reset a user password' })
  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.iamService.resetPassword(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Unlock a locked user account' })
  @Post('users/:id/unlock')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlockUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.iamService.unlockUser(user.organizationId, id);
  }

  // ─── User Roles ───────────────────────────────────────────────

  @ApiOperation({ summary: 'Assign a role to a user' })
  @Post('users/:id/roles')
  assignRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.iamService.assignRole(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Remove a role from a user' })
  @Delete('users/:id/roles/:userRoleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Param('userRoleId') userRoleId: string,
  ) {
    return this.iamService.removeRole(user.organizationId, id, userRoleId);
  }

  // ─── Roles ────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create a role' })
  @Post('roles')
  createRole(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRoleDto,
  ) {
    return this.iamService.createRole(user.organizationId, dto);
  }

  @ApiOperation({ summary: 'List all roles' })
  @Get('roles')
  findRoles(@CurrentUser() user: CurrentUserPayload) {
    return this.iamService.findRoles(user.organizationId);
  }

  @ApiOperation({ summary: 'Get a role by ID' })
  @Get('roles/:id')
  findRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.iamService.findRole(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Update a role' })
  @Patch('roles/:id')
  updateRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.iamService.updateRole(user.organizationId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a role' })
  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.iamService.deleteRole(user.organizationId, id);
  }

  @ApiOperation({ summary: 'Sync permissions for a role (full replace)' })
  @Post('roles/:id/permissions')
  assignPermissions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.iamService.assignPermissions(user.organizationId, id, dto);
  }

  // ─── Permissions ──────────────────────────────────────────────

  @ApiOperation({ summary: 'List all available permissions' })
  @Get('permissions')
  findPermissions() {
    return this.iamService.findPermissions();
  }
}
