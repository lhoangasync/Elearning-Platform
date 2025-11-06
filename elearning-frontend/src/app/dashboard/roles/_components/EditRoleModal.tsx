"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { getErrorMessage } from "@/utils/error-message";
import { getRoleById, RoleDetails, updateRole } from "@/services/role.service";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { groupPermissionsByModule } from "@/utils/get-initial";
import { getAllPermissions, Permissions } from "@/services/permission.service";
import { Separator } from "@/components/ui/separator";

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleId: string | null;
}

const editRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
  permissionIds: z.array(z.string()).optional(),
});

type EditRoleFormValues = z.infer<typeof editRoleSchema>;

export function EditRoleModal({
  isOpen,
  onClose,
  onSuccess,
  roleId,
}: EditRoleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [roleDetails, setRoleDetails] = useState<RoleDetails | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permissions[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );

  const form = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      permissionIds: [],
    },
  });

  // Fetch role details
  useEffect(() => {
    const fetchRoleDetails = async () => {
      if (!isOpen || !roleId) return;

      setIsLoadingRole(true);
      try {
        const data = await getRoleById(roleId);
        setRoleDetails(data);

        // Set form values
        form.reset({
          name: data.name,
          description: data.description || "",
          isActive: data.isActive,
        });

        // Set selected permissions
        const permissionIds = data.permissions.map((p) => p.id);
        setSelectedPermissions(new Set(permissionIds));
      } catch (error) {
        toast.error("Failed to fetch role details", {
          description: getErrorMessage(error),
        });
        onClose();
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchRoleDetails();
  }, [isOpen, roleId, form, onClose]);

  // Fetch all permissions
  useEffect(() => {
    const fetchAllPermissions = async () => {
      if (!isOpen) return;

      setIsLoadingPermissions(true);
      try {
        // Fetch với limit lớn để lấy tất cả permissions
        const response = await getAllPermissions(1, 1000);
        setAllPermissions(response.data);
      } catch (error) {
        toast.error("Failed to fetch permissions", {
          description: getErrorMessage(error),
        });
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchAllPermissions();
  }, [isOpen]);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
      POST: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400",
      PUT: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
      PATCH:
        "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      DELETE: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    };
    return colors[method] || "bg-gray-500/10 text-gray-600";
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const onSubmit = async (values: EditRoleFormValues) => {
    if (!roleId) return;

    setIsSubmitting(true);
    try {
      await updateRole(roleId, {
        name: values.name,
        description: values.description,
        isActive: values.isActive,
        permissionIds: Array.from(selectedPermissions),
      } as any);

      toast.success("Role updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update role", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedPermissions = groupPermissionsByModule(allPermissions);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update role information and manage permissions.
          </DialogDescription>
        </DialogHeader>

        {isLoadingRole || isLoadingPermissions ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this role does..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Set whether this role is active or not
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Permissions ({selectedPermissions.size} selected)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedPermissions(
                          new Set(allPermissions.map((p) => p.id))
                        )
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPermissions(new Set())}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No permissions available.
                  </p>
                ) : (
                  <div className="border rounded-md">
                    <Accordion type="multiple" className="w-full">
                      {Object.entries(groupedPermissions).map(
                        ([moduleName, perms]) => {
                          const moduleSelectedCount = perms.filter((p) =>
                            selectedPermissions.has(p.id)
                          ).length;

                          return (
                            <AccordionItem key={moduleName} value={moduleName}>
                              <AccordionTrigger className="px-4 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-medium">
                                    {moduleName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-xs ml-2"
                                  >
                                    {moduleSelectedCount}/{perms.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4">
                                <div className="space-y-2 pt-2">
                                  {perms.map((perm) => (
                                    <div
                                      key={perm.id}
                                      className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                                    >
                                      <div className="flex-1 min-w-0 mr-4">
                                        <p className="font-medium text-sm truncate">
                                          {perm.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                          <Badge
                                            className={cn(
                                              "text-xs font-semibold",
                                              getMethodColor(perm.method)
                                            )}
                                          >
                                            {perm.method}
                                          </Badge>
                                          <span className="font-mono truncate">
                                            {perm.path}
                                          </span>
                                        </div>
                                      </div>
                                      <Switch
                                        checked={selectedPermissions.has(
                                          perm.id
                                        )}
                                        onCheckedChange={() =>
                                          handlePermissionToggle(perm.id)
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        }
                      )}
                    </Accordion>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <LoadingSpinner />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
