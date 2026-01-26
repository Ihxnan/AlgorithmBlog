// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805106325700608
#include "../../template.cpp"

void init()
{
    cin >> t;
}

void solve()
{
    int n;
    cin >> n;
    for (int i = 2; i <= sqrt(n); ++i)
        if (n % i == 0)
        {
            cout << "No" << endl;
            return;
        }
    yn(n > 1);
}
