import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html'
})
export class UserDetailComponent implements OnInit {
  user?: User;
  userForm: FormGroup;

  constructor(private route: ActivatedRoute, private userService: UserService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if(id) {
      this.userService.getUser(id).subscribe({
        next: (data) => {
          this.user = data;
          this.userForm.patchValue(data);
        },
        error: (err) => console.error(err)
      });
    }
  }

  onSubmit() {
    if(this.user && this.user._id && this.userForm.valid) {
      this.userService.updateUser(this.user._id, this.userForm.value).subscribe({
        next: (res) => alert('Usuario actualizado'),
        error: (err) => console.error(err)
      });
    }
  }
}
